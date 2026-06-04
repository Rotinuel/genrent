import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { verifyAccountNumber, createTransferRecipient } from '@/lib/paystack'

// POST /api/owner/bank
export async function POST(request) {
  try {
    const user = await requireAuth(['owner'])
    const { account_number, bank_code, bank_name } = await request.json()

    if (!account_number || !bank_code) {
      return NextResponse.json({ error: 'account_number and bank_code are required' }, { status: 400 })
    }

    // Verify account with Paystack
    let accountName
    try {
      const verified = await verifyAccountNumber({ account_number, bank_code })
      accountName = verified.account_name
    } catch {
      return NextResponse.json({ error: 'Could not verify account number. Please check your details.' }, { status: 400 })
    }

    // Create Paystack transfer recipient
    const recipient = await createTransferRecipient({
      name: accountName,
      account_number,
      bank_code,
    })

    const supabase = getSupabaseAdmin()

    await supabase
      .from('users')
      .update({
        bank_account: {
          account_number,
          bank_code,
          bank_name: bank_name || bank_code,
          account_name: accountName,
        },
        paystack_subaccount_code: recipient.recipient_code,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      account_name: accountName,
      recipient_code: recipient.recipient_code,
    })
  } catch (err) {
    console.error('[POST /api/owner/bank]', err)
    return NextResponse.json({ error: err.message || 'Failed to save bank account' }, { status: 500 })
  }
}

// GET /api/owner/bank — get available banks from Paystack
export async function GET() {
  try {
    await requireAuth(['owner'])
    const { listBanks } = await import('@/lib/paystack')
    const banks = await listBanks()
    return NextResponse.json({ banks })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
