import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'SUPER_ADMIN') return errorResponse('Forbidden', 403)

    const { id: pumpId } = await params
    const { phone } = await req.json()
    if (!phone) return errorResponse('Admin phone number is required')

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) return errorResponse('User not found with this phone number', 404)

    // Update user role to PUMP_ADMIN if they're a regular user
    if (user.role === 'USER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'PUMP_ADMIN' }
      })
    }

    const pumpAdmin = await prisma.pumpAdmin.create({
      data: { userId: user.id, pumpId },
      include: { user: { select: { name: true, phone: true } } }
    })

    return successResponse(pumpAdmin, 201)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return errorResponse('User is already an admin of this pump')
    }
    console.error('Assign admin error:', error)
    return errorResponse('Failed to assign admin', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (session.role !== 'SUPER_ADMIN') return errorResponse('Forbidden', 403)

    const { id: pumpId } = await params
    const { userId } = await req.json()

    await prisma.pumpAdmin.deleteMany({
      where: { userId, pumpId }
    })

    // Check if user is admin of any other pump
    const otherPumps = await prisma.pumpAdmin.findFirst({
      where: { userId }
    })

    if (!otherPumps) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'USER' }
      })
    }

    return successResponse({ message: 'Admin removed' })
  } catch (error) {
    console.error('Remove admin error:', error)
    return errorResponse('Failed to remove admin', 500)
  }
}
