import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getWeekStart } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId') || session.userId

    // Only admins can check other users' quota
    if (userId !== session.userId && session.role === 'USER') {
      return errorResponse('Forbidden', 403)
    }

    const weekStart = getWeekStart()
    const weeklyLimit = parseFloat(process.env.WEEKLY_FUEL_LIMIT_LITERS || '5')

    const distributions = await prisma.distribution.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart }
      },
      include: {
        pump: { select: { name: true, area: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const used = distributions.reduce((sum, d) => sum + d.amount, 0)

    return successResponse({
      weeklyLimit,
      used: Math.round(used * 100) / 100,
      remaining: Math.round((weeklyLimit - used) * 100) / 100,
      distributions,
      weekStart: weekStart.toISOString()
    })
  } catch (error) {
    console.error('Quota error:', error)
    return errorResponse('Failed to get quota', 500)
  }
}
