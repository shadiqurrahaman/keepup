import twilio from 'twilio'

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token || sid === 'your-twilio-account-sid') {
    return null
  }
  return twilio(sid, token)
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  try {
    const client = getClient()
    if (!client) {
      console.log(`[DEV] OTP for ${phone}: ${code}`)
      return true
    }

    // Format phone number for Bangladesh (add +880 if not present)
    let formattedPhone = phone
    if (phone.startsWith('0')) {
      formattedPhone = '+880' + phone.substring(1)
    } else if (!phone.startsWith('+')) {
      formattedPhone = '+880' + phone
    }

    await client.messages.create({
      body: `Your FuelTrack verification code is: ${code}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    })
    return true
  } catch (error) {
    console.error('Failed to send OTP:', error)
    return false
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
