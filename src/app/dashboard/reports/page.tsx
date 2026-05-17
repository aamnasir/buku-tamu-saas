'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function ReportsPage() {
  const supabase = createClient()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [visitors, setVisitors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Default: Bulan ini
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(todayStr)

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (profile) {
        setSchoolId(profile.school_id)
        fetchReport(profile.school_id, firstDayOfMonth, todayStr)
      }
    }
    initData()
  }, [])

  const fetchReport = async (sId: string, start: string, end: string) => {
    setLoading(true)
    
    // Tambahkan waktu agar mencakup seluruh hari di endDate (23:59:59)
    const startIso = `${start}T00:00:00`
    const endIso = `${end}T23:59:59`

    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('school_id', sId)
      .gte('check_in_time', startIso)
      .lte('check_in_time', endIso)
      .order('check_in_time', { ascending: true })

    if (!error) setVisitors(data || [])
    setLoading(false)
  }

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    if (schoolId) fetchReport(schoolId, startDate, endDate)
  }

  const exportToCSV = () => {
    if (visitors.length === 0) {
      alert("Tidak ada data untuk di-export")
      return
    }

    // Header kolom CSV
    const headers = ["No", "Nama Lengkap", "No Identitas", "Kategori", "Tujuan", "Staff Tujuan", "Waktu Check-in", "Tipe Check-in"]
    
    // Ubah data JSON ke baris array
    const csvRows = visitors.map((v, index) => {
      const time = new Date(v.check_in_time).toLocaleString('id-ID')
      // Escape koma dengan memakai double quote
      return [
        index + 1,
        `"${v.full_name}"`,
        `"${v.identity_number}"`,
        v.category,
        v.purpose,
        `"${v.target_staff || '-'}"`,
        `"${time}"`,
        v.check_in_type
      ].join(",")
    })

    // Gabungkan header dan baris
    const csvContent = [headers.join(","), ...csvRows].join("\n")

    // Buat Blob dan trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_BukuTamu_${startDate}_sd_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Laporan & Export Data</h1>

      {/* Filter Tanggal */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark mb-8">
        <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-muted mb-1">Dari Tanggal</label>
            <input 
              type="date" 
              required
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-muted mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              required
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" 
            />
          </div>
          <button type="submit" className="bg-primary hover:bg-primary-light text-white px-6 py-2 rounded-xl font-bold transition-colors cursor-pointer w-full md:w-auto">
            Tampilkan Laporan
          </button>
        </form>
      </div>

      {/* Hasil Laporan & Tombol Export */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-heading font-bold text-lg text-primary">Hasil Data</h2>
            <p className="text-sm text-muted">Total: {visitors.length} pengunjung</p>
          </div>
          <button 
            onClick={exportToCSV} 
            disabled={visitors.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export CSV (Excel)
          </button>
        </div>

        {loading ? <p className="text-muted py-4">Memuat data...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-cream-dark">
                  <th className="py-2 text-muted uppercase">Nama</th>
                  <th className="py-2 text-muted uppercase">Kategori</th>
                  <th className="py-2 text-muted uppercase">Staff</th>
                  <th className="py-2 text-muted uppercase">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted">Tidak ada data di rentang tanggal ini</td></tr>
                )}
                {visitors.map((v: any) => (
                  <tr key={v.id} className="border-b border-cream-dark hover:bg-cream/50">
                    <td className="py-2 font-medium">{v.full_name}</td>
                    <td className="py-2">
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{v.category}</span>
                    </td>
                    <td className="py-2 text-muted">{v.target_staff || '-'}</td>
                    <td className="py-2 text-muted">{new Date(v.check_in_time).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}