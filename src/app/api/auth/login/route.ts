import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()
    if (!phone || !password) return errorResponse('Phone and password are required')

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) return errorResponse('Invalid credentials', 401)

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return errorResponse('Invalid credentials', 401)

    const token = await createToken({ userId: user.id, phone: user.phone, role: user.role })
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return successResponse({
      user: {
        id: user.id, phone: user.phone, name: user.name, role: user.role,
        nid: user.nid, nidVerified: user.nidVerified,
        licensePlate: user.licensePlate, licenseVerified: user.licenseVerified
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Login failed', 500)
  }
}
