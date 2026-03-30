const SMS_API_URL = 'https://api.sms.net.bd/sendsms'

function formatBDPhone(phone: string): string {
  // Normalize to 8801XXXXXXXXX format required by sms.net.bd
  if (phone.startsWith('+880')) return phone.substring(1)       // +8801XX → 8801XX
  if (phone.startsWith('880')) return phone                      // already correct
  if (phone.startsWith('01')) return '880' + phone               // 01XX → 88001XX
  return '880' + phone
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  const apiKey = process.env.SMS_NET_BD_API_KEY
  if (!apiKey || apiKey === 'your-sms-net-bd-api-key') {
    console.log(`[DEV] OTP for ${phone}: ${code}`)
    return true
  }

  try {
    const formData = new FormData()
    formData.append('api_key', apiKey)
    formData.append('msg', `Your FuelTrack verification code is: ${code}. Valid for 5 minutes.`)
    formData.append('to', formatBDPhone(phone))

    const res = await fetch(SMS_API_URL, { method: 'POST', body: formData })
    const data = await res.json() as { error: number; msg: string }

    if (data.error !== 0) {
      console.error('sms.net.bd error:', data.error, data.msg)
      return false
    }
    return true
  } catch (error) {
    console.error('Failed to send OTP:', error)
    return false
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
