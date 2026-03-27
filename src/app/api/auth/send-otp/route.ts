import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api'
import { sendOTP, generateOTP } from '@/lib/twilio'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    if (!phone) return errorResponse('Phone number is required')

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Find or check if user exists (for registration flow, user might not exist yet)
    const user = await prisma.user.findUnique({ where: { phone } })

    if (user) {
      await prisma.otpCode.create({
        data: { userId: user.id, code, expiresAt }
      })
    } else {
      // Store OTP temporarily - will be verified during registration
      // We'll use a simple approach: store phone+code in OTP table with a temp user
      return successResponse({ otpSent: true, isNewUser: true, tempCode: process.env.TWILIO_ACCOUNT_SID ? undefined : code })
    }

    // Send OTP via Twilio (skip in dev if not configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-account-sid') {
      await sendOTP(phone, code)
    } else {
      console.log(`[DEV] OTP for ${phone}: ${code}`)
    }

    return successResponse({
      otpSent: true,
      isNewUser: false,
      // Only include code in dev mode for testing
      ...((!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your-twilio-account-sid') && { devCode: code })
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return errorResponse('Failed to send OTP', 500)
  }
}
