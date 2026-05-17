import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { email, password, full_name, school_id } = body

  // Gunakan Service Role Key agar bisa membuat user baru tanpa login ulang
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Langsung aktif tanpa verifikasi email
    user_metadata: {
      full_name: full_name,
      school_id: school_id,
      role: 'staff' // Set rolenya sebagai staff
    }
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}