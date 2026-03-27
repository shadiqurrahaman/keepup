import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'SUPER_ADMIN') return errorResponse('Forbidden', 403)

    const { id } = await params
    const { name, location, area, latitude, longitude, isActive } = await req.json()

    const pump = await prisma.pump.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(area && { area }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return successResponse(pump)
  } catch (error) {
    console.error('Update pump error:', error)
    return errorResponse('Failed to update pump', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'SUPER_ADMIN') return errorResponse('Forbidden', 403)

    const { id } = await params
    await prisma.pump.delete({ where: { id } })
    return successResponse({ message: 'Pump deleted' })
  } catch (error) {
    console.error('Delete pump error:', error)
    return errorResponse('Failed to delete pump', 500)
  }
}
