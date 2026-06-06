import { NextResponse } from 'next/server'
import { checkTokenExpiry } from '@/lib/instagram'

export async function GET() {
  try {
    const { daysLeft, expiresAt } = await checkTokenExpiry()
    return NextResponse.json({ daysLeft, expiresAt: expiresAt.toISOString() })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Token-Check fehlgeschlagen' },
      { status: 500 }
    )
  }
}
