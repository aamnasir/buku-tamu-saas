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
  return (
    // ... kode sidebar dan children tetap sama seperti sebelumnya ...
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col p-6 hidden md:flex">
        <h1 className="text-2xl font-heading font-bold mb-8 text-accent">BukuTamu</h1>
        
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
            📊 Dashboard
          </Link>
          <Link href="/dashboard/blacklist" className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
            🚫 Daftar Pembatasan
          </Link>
          <Link href="/dashboard/appointments" className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
            📅 Appointment
          </Link>
           <Link href="/dashboard/reports" className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
    📄 Laporan & Export
  </Link>
  <Link href="/dashboard/staff" className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
  👥 Kelola Staff
</Link>
          <Link href="/kiosk" className="block py-2 px-4 rounded-lg hover:bg-white/10 transition-colors">
            📱 Mode Kiosk
          </Link>
        </nav>

        <form action="/auth/signout" method="post" className="mt-auto">
          <button type="submit" className="w-full text-left py-2 px-4 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors">
            🚪 Logout
          </button>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 flex justify-between items-center">
           <h1 className="text-xl font-heading font-bold text-primary">BukuTamu</h1>
           <form action="/auth/signout" method="post">
             <button type="submit" className="text-red-500 text-sm font-bold">Logout</button>
           </form>
        </div>
        {children}
      </main>
    </div>
  )
}