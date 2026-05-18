import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from './sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/')

  // CEK ROLE: Jika bukan admin, tendang ke kiosk
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    redirect('/kiosk')
  }
// Gunakan komponen Sidebar yang berisi logika buka/tutup
  return <Sidebar>{children}</Sidebar>
}
  