import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation"
import VisitorsTable from "./visitors-table" // Import komponen tabel tadi

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(name)')
    .eq('id', user.id)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: visitors } = await supabase
    .from('visitors')
    .select('*')
    .gte('check_in_time', today.toISOString())
    .order('check_in_time', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-1">Dashboard Utama</h1>
      <p className="text-muted mb-8">
        Selamat datang, <span className="font-semibold text-primary">{profile?.full_name}</span>! 
        Sekolah: {profile?.schools?.name || 'Belum terdaftar'}
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
          <p className="text-sm text-muted uppercase tracking-wider mb-2">Pengunjung Hari Ini</p>
          <p className="text-4xl font-heading font-bold text-primary">{visitors?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
          <p className="text-sm text-muted uppercase tracking-wider mb-2">Status SaaS</p>
          <p className="text-4xl font-heading font-bold text-accent">Aktif</p>
        </div>
      </div>

      {/* Tabel Pengunjung Real-time */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
        <h2 className="font-heading font-bold text-lg text-primary mb-4">Pengunjung Terbaru (Live)</h2>
        <VisitorsTable initialVisitors={visitors || []} schoolId={profile?.school_id || ''} />
      </div>
    </div>
  )
}