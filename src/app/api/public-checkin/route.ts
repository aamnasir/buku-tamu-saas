import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { school_id, full_name, identity_number, category, purpose, target_staff } = body

  if (!school_id || !full_name || !identity_number) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Cek Blacklist
  const { data: blData } = await supabaseAdmin
    .from('blacklist')
    .select('id')
    .eq('identity_number', identity_number)
    .eq('school_id', school_id)
    .maybeSingle()

  if (blData) {
    return NextResponse.json({ error: "PENGUNJUNG_BLACKLIST" }, { status: 403 })
  }

  // Insert data
  const { error } = await supabaseAdmin.from('visitors').insert({
    school_id,
    full_name,
    identity_number,
    category: category || 'other',
    purpose: purpose || 'other',
    target_staff: target_staff || '-',
    check_in_type: 'self_scan'
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}