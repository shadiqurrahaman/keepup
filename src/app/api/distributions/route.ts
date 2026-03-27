import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getWeekStart } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'PUMP_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return errorResponse('Only pump admins can distribute fuel', 403)
    }

    const { userId, amount, vehicleType, pumpId: bodyPumpId } = await req.json()
    if (!userId || !amount || !vehicleType) {
      return errorResponse('userId, amount, and vehicleType are required')
    }

    if (amount <= 0 || amount > 5) {
      return errorResponse('Amount must be between 0 and 5 liters')
    }

    // Get admin's pump
    const pumpAdmin = await prisma.pumpAdmin.findFirst({
      where: { userId: session.userId },
      include: { pump: true }
    })

    if (!pumpAdmin && session.role !== 'SUPER_ADMIN') {
      return errorResponse('You are not assigned to any pump', 403)
    }

    // For super admin without pump assignment, require pumpId
    let pumpId = pumpAdmin?.pumpId
    if (!pumpId && session.role === 'SUPER_ADMIN') {
      pumpId = bodyPumpId
      if (!pumpId) return errorResponse('Pump ID is required for super admin')
    }

    // Check user's weekly quota
    const weekStart = getWeekStart()
    const weeklyLimit = parseFloat(process.env.WEEKLY_FUEL_LIMIT_LITERS || '5')

    const weeklyUsage = await prisma.distribution.aggregate({
      where: {
        userId,
        createdAt: { gte: weekStart }
      },
      _sum: { amount: true }
    })

    const used = weeklyUsage._sum.amount || 0
    const remaining = weeklyLimit - used

    if (amount > remaining) {
      return errorResponse(`Exceeds weekly limit. Remaining: ${remaining.toFixed(2)}L`, 400)
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return errorResponse('User not found', 404)

    const distribution = await prisma.distribution.create({
      data: {
        userId,
        pumpId: pumpId!,
        adminId: session.userId,
        amount: parseFloat(amount.toString()),
        vehicleType,
      },
      include: {
        user: { select: { name: true, phone: true } },
        pump: { select: { name: true } }
      }
    })

    return successResponse(distribution, 201)
  } catch (error) {
    console.error('Distribution error:', error)
    return errorResponse('Failed to create distribution', 500)
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const today = searchParams.get('today') === 'true'

    let where: Record<string, unknown> = {}

    if (session.role === 'USER') {
      where = { userId: session.userId }
    } else if (session.role === 'PUMP_ADMIN') {
      const pumpAdmin = await prisma.pumpAdmin.findFirst({
        where: { userId: session.userId }
      })
      if (pumpAdmin) {
        where = { pumpId: pumpAdmin.pumpId }
      }
    }
    // SUPER_ADMIN sees all

    if (today) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      where.createdAt = { gte: todayStart }
    }

    const [distributions, total] = await Promise.all([
      prisma.distribution.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          pump: { select: { name: true, area: true } },
          admin: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.distribution.count({ where })
    ])

    return successResponse({ distributions, total, page, limit })
  } catch (error) {
    console.error('Get distributions error:', error)
    return errorResponse('Failed to get distributions', 500)
  }
}
