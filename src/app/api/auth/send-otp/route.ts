import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { sendOTP, generateOTP } from '@/lib/sms'

const isDev = !process.env.SMS_NET_BD_API_KEY || process.env.SMS_NET_BD_API_KEY === 'your-sms-net-bd-api-key'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return errorResponse('Phone number is required')

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const user = await prisma.user.findUnique({ where: { phone } })

    if (user) {
      // Existing user (e.g. login OTP flow)
      await prisma.otpCode.create({
        data: { userId: user.id, code, expiresAt }
      })
    } else {
      // New user — store OTP keyed by phone in PendingOtp
      await prisma.pendingOtp.create({
        data: { phone, code, expiresAt }
      })
    }

    await sendOTP(phone, code)

    return successResponse({
      otpSent: true,
      isNewUser: !user,
      ...(isDev && { devCode: code })
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return errorResponse('Failed to send OTP', 500)
  }
}
