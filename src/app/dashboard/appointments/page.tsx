'use client'

import { createClient } from '../../../lib/supabase/client'
import { useEffect, useState } from 'react'

export default function AppointmentsPage() {
  const supabase = createClient()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [visitorName, setVisitorName] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [datetime, setDatetime] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (profile) {
        setSchoolId(profile.school_id)
        fetchAppointments(profile.school_id)
      }
    }
    initData()
  }, [])

  const fetchAppointments = async (sId: string) => {
    setLoading(true)
    const { data } = await supabase.from('appointments').select('*').eq('school_id', sId).order('requested_datetime', { ascending: true })
    setAppointments(data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return

    const { error } = await supabase.from('appointments').insert({
      school_id: schoolId,
      visitor_name: visitorName,
      visitor_phone: visitorPhone,
      requested_datetime: datetime,
      notes: notes,
      status: 'pending'
    })

    if (!error) {
      setVisitorName(''); setVisitorPhone(''); setDatetime(''); setNotes('')
      fetchAppointments(schoolId)
    } else {
      alert("Gagal membuat appointment: " + error.message)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id)
    if (!error && schoolId) fetchAppointments(schoolId)
  }

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Manajemen Appointment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Form Buat Janji */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-cream-dark h-fit">
          <h2 className="font-heading font-bold text-lg text-primary mb-4">Buat Janji Baru</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" required placeholder="Nama Pengunjung" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <input type="tel" placeholder="No. Telepon" value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <input type="datetime-local" required value={datetime} onChange={(e) => setDatetime(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" />
            <textarea placeholder="Catatan tujuan..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border border-cream-dark rounded-lg focus:outline-none focus:border-accent" rows={2}></textarea>
            <button type="submit" className="w-full bg-accent hover:bg-accent-light text-white font-bold py-2 rounded-xl transition-colors cursor-pointer">
              Buat Appointment
            </button>
          </form>
        </div>

        {/* Daftar Appointment */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? <p className="text-muted">Memuat data...</p> : (
            appointments.length === 0 ? <p className="text-muted bg-white p-6 rounded-2xl">Belum ada appointment.</p> :
            appointments.map((appt: any) => (
              <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-cream-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-primary">{appt.visitor_name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      appt.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted">📞 {appt.visitor_phone || '-'}</p>
                  <p className="text-sm text-muted">🗓️ {new Date(appt.requested_datetime).toLocaleString('id-ID')}</p>
                  {appt.notes && <p className="text-xs text-muted mt-1 italic">"{appt.notes}"</p>}
                </div>
                
                {appt.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(appt.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer">
                      Setujui
                    </button>
                    <button onClick={() => updateStatus(appt.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer">
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}