import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    let pumps;
    if (session.role === 'PUMP_ADMIN') {
      pumps = await prisma.pump.findMany({
        where: {
          admins: { some: { userId: session.userId } }
        },
        include: {
          admins: { include: { user: { select: { name: true, phone: true } } } },
          _count: { select: { distributions: true } }
        }
      })
    } else if (session.role === 'SUPER_ADMIN') {
      pumps = await prisma.pump.findMany({
        include: {
          admins: { include: { user: { select: { name: true, phone: true } } } },
          _count: { select: { distributions: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      pumps = await prisma.pump.findMany({
        where: { isActive: true },
        select: { id: true, name: true, location: true, area: true, latitude: true, longitude: true }
      })
    }

    return successResponse(pumps)
  } catch (error) {
    console.error('Get pumps error:', error)
    return errorResponse('Failed to get pumps', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'SUPER_ADMIN') return errorResponse('Forbidden', 403)

    const { name, location, area, latitude, longitude } = await req.json()
    if (!name || !location || !area) {
      return errorResponse('Name, location, and area are required')
    }

    const pump = await prisma.pump.create({
      data: {
        name,
        location,
        area,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }
    })

    return successResponse(pump, 201)
  } catch (error) {
    console.error('Create pump error:', error)
    return errorResponse('Failed to create pump', 500)
  }
}
