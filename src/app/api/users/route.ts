import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'PUMP_ADMIN' && session.role !== 'SUPER_ADMIN') {
      return errorResponse('Forbidden', 403)
    }

    const searchParams = req.nextUrl.searchParams
    const phone = searchParams.get('phone')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let where: Record<string, unknown> = {}
    if (phone) {
      where = { phone: { contains: phone } }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, phone: true, name: true, role: true,
          nid: true, nidVerified: true, licensePlate: true, licenseVerified: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    return successResponse({ users, total, page, limit })
  } catch (error) {
    console.error('Get users error:', error)
    return errorResponse('Failed to get users', 500)
  }
}
