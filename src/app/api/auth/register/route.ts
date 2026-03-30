import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { phone, password, name, nid, licensePlate, otpCode } = await req.json()

    if (!phone || !password || !name) {
      return errorResponse('Phone, password, and name are required')
    }
    if (!otpCode) {
      return errorResponse('OTP code is required')
    }
    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters')
    }

    // Verify OTP
    const pending = await prisma.pendingOtp.findFirst({
      where: {
        phone,
        code: otpCode,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!pending) {
      return errorResponse('Invalid or expired OTP code')
    }

    // Mark OTP as used
    await prisma.pendingOtp.update({
      where: { id: pending.id },
      data: { used: true },
    })

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) return errorResponse('Phone number already registered')

    if (nid) {
      const nidExists = await prisma.user.findUnique({ where: { nid } })
      if (nidExists) return errorResponse('NID already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        name,
        nid: nid || null,
        licensePlate: licensePlate || null,
      },
      select: {
        id: true, phone: true, name: true, role: true,
        nid: true, nidVerified: true, licensePlate: true, licenseVerified: true
      }
    })

    const token = await createToken({ userId: user.id, phone: user.phone, role: user.role })
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return successResponse({ user }, 201)
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Registration failed', 500)
  }
}
