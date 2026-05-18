'use client'

import { createClient } from '../../lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'

function CheckinForm() {
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('school_id')
  const supabase = createClient()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [schoolName, setSchoolName] = useState('Sekolah')
  const [loading, setLoading] = useState(false)
  const [screen, setScreen] = useState<'form' | 'success' | 'blacklist'>('form')
  
  const [name, setName] = useState('')
  const [identity, setIdentity] = useState('')
  const [category, setCategory] = useState('parent')
  const [purpose, setPurpose] = useState('meeting')
  const [targetStaff, setTargetStaff] = useState('')
  
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [photoData, setPhotoData] = useState<string | null>(null)

  useEffect(() => {
    if (schoolId) {
      const fetchSchool = async () => {
        const { data } = await supabase.from('schools').select('name').eq('id', schoolId).single()
        if (data) setSchoolName(data.name)
      }
      fetchSchool()
    }
  }, [schoolId, supabase])

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  const startCamera = async () => {
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true) }
    } catch (err) { setCameraError(true); setCameraActive(false) }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = videoRef.current.videoWidth || 320
      canvas.height = videoRef.current.videoHeight || 240
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      setPhotoData(canvas.toDataURL('image/jpeg', 0.7))
      stopCamera()
    }
  }

  const retakePhoto = () => { setPhotoData(null); startCamera() }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
      setCameraActive(false)
    }
  }

  const sendWhatsApp = async (sId: string, type: string, vName: string, vIdentity: string, vCategory: string) => {
    try {
      const { data: schoolData } = await supabase.from('schools').select('notification_phone, notify_blacklist, notify_vip').eq('id', sId).single()
      if (!schoolData?.notification_phone) return
      if (type === "ALERT_BLACKLIST" && !schoolData.notify_blacklist) return
      if (type === "CHECKIN_VIP" && !schoolData.notify_vip) return

      let message = ""
      if (type === "ALERT_BLACKLIST") {
        message = `🚨 *ALERT KEAMANAN*\nPengunjung di daftar pembatasan mencoba check-in!\n\n👤 Nama: ${vName}\n🪪 Identitas: ${vIdentity}\n⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\nHarap segera ditindaklanjuti oleh Security.`
      } else {
        message = `🔔 *Tamu Penting Check-in*\n\n👤 Nama: ${vName}\n📁 Kategori: ${vCategory}\n⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\nMohon persiapan ruangan jika diperlukan.`
      }

      await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_phone: schoolData.notification_phone, message })
      })
    } catch (err) {
      console.error("Gagal kirim WA:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return alert("ID Sekolah tidak valid")
    setLoading(true)
    stopCamera()

    try {
      const res = await fetch('/api/public-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          school_id: schoolId, 
          full_name: name, 
          identity_number: identity, 
          category, 
          purpose, 
          target_staff: targetStaff 
        })
      })

      const result = await res.json()

      if (!res.ok) {
        if (result.error === "PENGUNJUNG_BLACKLIST") {
          setScreen('blacklist')
          sendWhatsApp(schoolId, "ALERT_BLACKLIST", name, identity, category)
        } else {
          alert("Gagal check-in: " + (result.error || "Terjadi kesalahan"))
        }
      } else {
        setScreen('success')
        if (category === 'government' || category === 'student_candidate' || category === 'media') {
          sendWhatsApp(schoolId, "CHECKIN_VIP", name, identity, category)
        }
      }
    } catch (err) {
      alert("Gagal menghubungi server. Cek koneksi internet Anda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="kiosk-container relative z-10 min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-6 text-white">
      <video ref={videoRef} autoPlay playsInline className={`${cameraActive && !photoData ? '' : 'hidden'} w-36 h-28 rounded-xl object-cover border-2 border-white/20 shadow-lg bg-black/20`}></video>
      <canvas ref={canvasRef} className="hidden"></canvas>

      {screen === 'form' && (
        <div className="max-w-lg mx-auto w-full animate-fade-in">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-heading font-900 drop-shadow-lg">Check-in Pengunjung</h1>
            <p className="text-white/50 text-sm mt-1">{schoolName}</p>
          </div>

          <div className="kiosk-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-xs block mb-1">Nama Lengkap *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-accent" placeholder="Nama sesuai KTP" />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">No. Identitas (KTP/SIM) *</label>
                  <input type="text" required value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-accent" placeholder="Nomor identitas" />
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Kategori *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                    <option value="parent" className="text-black">Orang Tua</option>
                    <option value="vendor" className="text-black">Vendor</option>
                    <option value="government" className="text-black">Pemerintah</option>
                    <option value="student_candidate" className="text-black">Calon Siswa</option>
                    <option value="other" className="text-black">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/60 text-xs block mb-1">Tujuan *</label>
                  <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white">
                    <option value="meeting" className="text-black">Meeting</option>
                    <option value="pickup" className="text-black">Pickup Anak</option>
                    <option value="delivery" className="text-black">Delivery</option>
                    <option value="other" className="text-black">Lainnya</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-white/60 text-xs block mb-1">Staff / Ruangan yang Dituju</label>
                <input type="text" value={targetStaff} onChange={(e) => setTargetStaff(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-accent" placeholder="Contoh: Ibu Dewi - Ruang Guru" />
              </div>

              <div>
                <label className="text-white/60 text-xs block mb-2">Foto Pengunjung (Opsional)</label>
                <div className="flex items-center gap-4">
                  {photoData && <img src={photoData} alt="Foto" className="w-24 h-24 rounded-xl object-cover border-2 border-white/40 shadow-lg" />}
                  {!cameraActive && !photoData && (
                    <div className="w-24 h-24 rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                      <span className="text-white/20 text-xs text-center px-2">Belum ada foto</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {!cameraActive && !photoData && (
                      <button type="button" onClick={startCamera} className="bg-white/10 border border-white/20 text-white text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                        <i className="fas fa-camera mr-1"></i> Nyalakan Kamera
                      </button>
                    )}
                    {cameraActive && !photoData && (
                      <button type="button" onClick={capturePhoto} className="bg-accent text-white text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">
                        <i className="fas fa-circle mr-1"></i> Ambil Foto
                      </button>
                    )}
                    {photoData && (
                      <button type="button" onClick={retakePhoto} className="bg-white/10 border border-white/20 text-white text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                        <i className="fas fa-redo mr-1"></i> Ulangi
                      </button>
                    )}
                    {cameraError && <p className="text-red-400 text-[10px] italic">Kamera ditolak.</p>}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-accent hover:bg-accent-light text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-lg mt-2 cursor-pointer shadow-lg">
                {loading ? 'Memproses...' : 'Submit Check-in'}
              </button>
            </form>
          </div>
        </div>
      )}

      {screen === 'success' && (
        <div className="text-center max-w-sm mx-auto animate-fade-in">
          <div className="kiosk-card p-10">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border-4 border-green-400/30 shadow-green-500/50 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-heading font-800 text-white mb-2">Check-in Berhasil!</h2>
            <p className="text-white/60 mb-1">{name}</p>
            <p className="text-white/40 text-sm mt-2">Anda boleh memasuki area sekolah.</p>
          </div>
        </div>
      )}

      {screen === 'blacklist' && (
        <div className="text-center max-w-sm mx-auto animate-fade-in">
          <div className="kiosk-card p-10 border border-red-500/30 shadow-red-500/30 shadow-lg">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 border-4 border-red-400/30 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h2 className="text-3xl font-heading font-800 text-red-400 mb-2">Akses Ditolak</h2>
            <p className="text-white/50 mb-6 text-sm">Anda terdaftar dalam daftar pembatasan. Security telah diberitahu.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="kiosk-container min-h-screen flex items-center justify-center text-white">
        Memuat formulir...
      </div>
    }>
      <CheckinForm />
    </Suspense>
  )
}