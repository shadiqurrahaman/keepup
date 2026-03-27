import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getWeekStart } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'PUMP_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const phone = req.nextUrl.searchParams.get('phone')
    if (!phone) return errorResponse('Phone number is required')

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true, phone: true, name: true,
        nid: true, nidVerified: true, licensePlate: true, licenseVerified: true
      }
    })

    if (!user) return errorResponse('User not found', 404)

    const weekStart = getWeekStart()
    const weeklyLimit = parseFloat(process.env.WEEKLY_FUEL_LIMIT_LITERS || '5')

    const weeklyUsage = await prisma.distribution.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: weekStart }
      },
      _sum: { amount: true }
    })

    const used = weeklyUsage._sum.amount || 0

    return successResponse({
      ...user,
      quota: {
        weeklyLimit,
        used: Math.round(used * 100) / 100,
        remaining: Math.round((weeklyLimit - used) * 100) / 100,
      }
    })
  } catch (error) {
    console.error('Search user error:', error)
    return errorResponse('Failed to search user', 500)
  }
}
