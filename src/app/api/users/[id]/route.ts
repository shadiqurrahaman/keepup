import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getWeekStart } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, phone: true, name: true, role: true,
        nid: true, nidVerified: true, licensePlate: true, licenseVerified: true
      }
    })

    if (!user) return errorResponse('User not found', 404)

    // Get weekly usage
    const weekStart = getWeekStart()
    const weeklyLimit = parseFloat(process.env.WEEKLY_FUEL_LIMIT_LITERS || '5')

    const weeklyUsage = await prisma.distribution.aggregate({
      where: {
        userId: id,
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
    console.error('Get user error:', error)
    return errorResponse('Failed to get user', 500)
  }
}
