import { prisma } from '@/lib/db'
import { getSession, getWeekStart } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'SUPER_ADMIN') return errorResponse('Forbidden', 403)

    const weekStart = getWeekStart()

    const [totalPumps, totalUsers, totalDistributions, weeklyDistributions, weeklyVolume] = await Promise.all([
      prisma.pump.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.distribution.count(),
      prisma.distribution.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.distribution.aggregate({
        where: { createdAt: { gte: weekStart } },
        _sum: { amount: true }
      })
    ])

    return successResponse({
      totalPumps,
      totalUsers,
      totalDistributions,
      weeklyDistributions,
      weeklyVolume: weeklyVolume._sum.amount || 0
    })
  } catch (error) {
    console.error('Stats error:', error)
    return errorResponse('Failed to get stats', 500)
  }
}
