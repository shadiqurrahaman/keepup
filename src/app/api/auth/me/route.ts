import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true, phone: true, name: true, role: true,
        nid: true, nidVerified: true, licensePlate: true, licenseVerified: true
      }
    })

    if (!user) return errorResponse('User not found', 404)
    return successResponse(user)
  } catch (error) {
    console.error('Me error:', error)
    return errorResponse('Failed to get user', 500)
  }
}
