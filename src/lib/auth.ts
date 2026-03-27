import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export interface JWTPayload {
  userId: string
  phone: string
  role: string
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  // Saturday = 6, so we calculate days since last Saturday
  const daysSinceSaturday = day === 6 ? 0 : day + 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysSinceSaturday)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

export function getWeekEnd(): Date {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  return weekEnd
}
