import { NextResponse } from 'next/server'
import { listBanks } from '@/lib/paystack'

export async function GET() {
  try {
    const banks = await listBanks()
    return NextResponse.json({ banks })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
