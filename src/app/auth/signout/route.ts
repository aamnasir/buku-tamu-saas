import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  
  // Hapus sesi login
  await supabase.auth.signOut()
  
  // Hapus cache dashboard
  revalidatePath('/', 'layout')
  
  // Redirect kembali ke halaman login
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}