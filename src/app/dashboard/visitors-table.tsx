'use client'

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function VisitorsTable({ initialVisitors, schoolId }: { initialVisitors: any[], schoolId: string }) {
  const supabase = createClient()
  const [visitors, setVisitors] = useState(initialVisitors)

  useEffect(() => {
    // 1. Set state awal dari Server Component
    setVisitors(initialVisitors)

    // 2. Subscribe ke perubahan Realtime di tabel visitors
    const channel = supabase
      .channel('realtime-visitors')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visitors', filter: `school_id=eq.${schoolId}` },
        (payload) => {
          // Saat ada data baru masuk, tambahkan ke atas daftar
          setVisitors((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    // 3. Cleanup saat komponen unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialVisitors, schoolId, supabase])

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-2 border-cream-dark">
            <th className="py-3 text-xs text-muted uppercase">Nama</th>
            <th className="py-3 text-xs text-muted uppercase">Kategori</th>
            <th className="py-3 text-xs text-muted uppercase">Waktu</th>
          </tr>
        </thead>
        <tbody>
          {visitors?.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center py-8 text-muted">Belum ada pengunjung hari ini</td>
            </tr>
          )}
          {visitors?.map((v: any) => (
            <tr key={v.id} className="border-b border-cream-dark hover:bg-cream/50 animate-pulse-once">
              <td className="py-3 text-sm font-medium">{v.full_name}</td>
              <td className="py-3">
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold">
                  {v.category}
                </span>
              </td>
              <td className="py-3 text-sm text-muted">
                {new Date(v.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}