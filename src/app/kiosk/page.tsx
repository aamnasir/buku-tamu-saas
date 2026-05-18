'use client'

import { createClient } from '../../lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveCheckInOffline, getOfflineCheckIns, deleteOfflineCheckIn } from '../../lib/offline-db'

export default function KioskPage() {
  const router = useRouter()
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState('')
    useEffect(() => {
  if (schoolId && typeof window !== 'undefined') {
    setQrUrl(`${window.location.origin}/checkin?school_id=${schoolId}`)
  }
}, [schoolId])
  const [loading, setLoading] = useState(false)
  const [screen, setScreen] = useState<'idle' | 'form' | 'success' | 'blacklist'>('idle')
  const [isOnline, setIsOnline] = useState(true)
  
  const [name, setName] = useState('')
  const [identity, setIdentity] = useState('')
  const [category, setCategory] = useState('parent')
  const [purpose, setPurpose] = useState('meeting')
  const [targetStaff, setTargetStaff] = useState('')
  const [photoData, setPhotoData] = useState<string | null>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    const getSchool = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()
      if (profile) setSchoolId(profile.school_id)
    }
    getSchool()
  }, [])

  const syncOfflineData = async () => {
    const offlineData: any = await getOfflineCheckIns()
    for (const data of offlineData) {
      const { error } = await supabase.from('visitors').insert({ school_id: data.school_id, full_name: data.full_name, identity_number: data.identity_number, category: data.category, purpose: data.purpose, target_staff: data.target_staff })
      if (!error) await deleteOfflineCheckIn(data.id)
    }
  }
  useEffect(() => { if (isOnline) syncOfflineData() }, [isOnline])

  // ===== WEBCAM LOGIC =====
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) { console.error("Camera error") }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = videoRef.current.videoWidth || 320
      canvas.height = videoRef.current.videoHeight || 240
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      setPhotoData(canvas.toDataURL('image/jpeg', 0.7))
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
    }
  }

  const retakePhoto = () => {
    setPhotoData(null)
    startCamera()
  }

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return
    setLoading(true)

    const visitorData = { school_id: schoolId, full_name: name, identity_number: identity, category, purpose, target_staff: targetStaff }

    if (isOnline) {
      const { data: blData } = await supabase.from('blacklist').select('id').eq('identity_number', identity).eq('school_id', schoolId).maybeSingle()
      if (blData) { setScreen('blacklist'); setLoading(false); return }
      
      const { error } = await supabase.from('visitors').insert(visitorData)
      if (error) alert("Gagal: " + error.message)
      else setScreen('success')
    } else {
      await saveCheckInOffline(visitorData)
      setScreen('success')
    }
    setLoading(false)
  }

  const resetKiosk = () => {
    setName(''); setIdentity(''); setTargetStaff(''); setPhotoData(null)
    setScreen('idle')
  }

  return (
    <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-6 text-white">
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      {/* Indikator Online/Offline Kecil */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50 bg-black/20 px-3 py-1.5 rounded-full">
        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-500'}`}></div>
        <span className="text-[10px] font-bold">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
      </div>

      {/* ===== IDLE SCREEN ===== */}
      {screen === 'idle' && (
        <div className="text-center max-w-md mx-auto w-full animate-fade-in">
          <h1 className="text-5xl font-heading font-900 mb-3 drop-shadow-lg">Selamat Datang</h1>
          <p className="text-white/50 text-lg mb-8">Silakan scan QR code atau tekan tombol untuk check-in</p>
          {/* QR Code Dinamis via API */}
<div className="w-64 h-64 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center p-4 shadow-2xl border-4 border-white/50">
  {qrUrl ? (
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`} 
      alt="QR Code Check-in" 
      className="w-full h-full object-contain"
    />
  ) : (
    <div className="text-primary text-xs animate-pulse text-center">Memuat QR Code...</div>
  )}

  
            <p className="text-white/40 text-xs">Scan dengan kamera HP Anda</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button onClick={() => { setScreen('form'); startCamera(); }} className="btn-kiosk bg-accent hover:bg-accent-light text-white py-4 px-8 text-lg rounded-xl font-heading font-bold shadow-lg transition-all hover:scale-105 cursor-pointer">
              Isi Formulir Check-in
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-kiosk text-white/40 hover:text-white py-4 px-8 text-lg rounded-xl border border-white/20 hover:border-white/40 transition-colors cursor-pointer">
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* ===== FORM SCREEN (Vanilla Match) ===== */}
      {screen === 'form' && (
        <div className="max-w-xl mx-auto w-full animate-fade-in">
          <button onClick={resetKiosk} className="text-white/40 hover:text-white mb-4 transition-colors text-sm"><i className="fas fa-arrow-left"></i> Kembali ke QR</button>
          <div className="kiosk-card p-8">
            <h2 className="text-2xl font-heading font-700 text-white mb-6 text-center">Formulir Check-in</h2>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-white/60 text-xs block mb-1">Nama Lengkap *</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-accent" placeholder="Nama sesuai KTP" /></div>
                <div><label className="text-white/60 text-xs block mb-1">No. Identitas *</label><input type="text" required value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-accent" placeholder="KTP/SIM" /></div>
                <div><label className="text-white/60 text-xs block mb-1">Kategori *</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"><option value="parent" className="text-black">Orang Tua</option><option value="vendor" className="text-black">Vendor</option><option value="government" className="text-black">Pemerintah</option><option value="student_candidate" className="text-black">Calon Siswa</option><option value="other" className="text-black">Lainnya</option></select></div>
                <div><label className="text-white/60 text-xs block mb-1">Tujuan *</label><select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white"><option value="meeting" className="text-black">Meeting</option><option value="pickup" className="text-black">Pickup Anak</option><option value="delivery" className="text-black">Delivery</option><option value="other" className="text-black">Lainnya</option></select></div>
                <div className="sm:col-span-2"><label className="text-white/60 text-xs block mb-1">Staff Tujuan *</label><input type="text" required value={targetStaff} onChange={(e) => setTargetStaff(e.target.value)} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30" placeholder="Nama staff/ruangan" /></div>
              </div>

              {/* ===== WEBCAM / PHOTO SECTION (Persis Vanilla) ===== */}
              <div>
                <label className="text-white/60 text-xs block mb-2">Foto Pengunjung</label>
                <div className="flex items-center gap-4">
                  {!photoData ? (
                    <video ref={videoRef} autoPlay playsInline className="w-40 h-32 rounded-xl object-cover border-2 border-white/20 shadow-lg bg-black/20"></video>
                  ) : (
                    <img src={photoData} alt="Foto" className="w-28 h-28 rounded-xl object-cover border-2 border-white/40 shadow-lg" />
                  )}
                  <div className="flex flex-col gap-2">
                    {!photoData ? (
                      <button type="button" onClick={capturePhoto} className="btn-kiosk bg-white/10 border border-white/20 text-white text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20"><i className="fas fa-camera mr-1"></i> Ambil Foto</button>
                    ) : (
                      <button type="button" onClick={retakePhoto} className="btn-kiosk bg-white/10 border border-white/20 text-white text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20"><i className="fas fa-redo mr-1"></i> Ulangi</button>
                    )}
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

      {/* ===== SUCCESS SCREEN ===== */}
      {screen === 'success' && (
        <div className="text-center max-w-sm mx-auto animate-fade-in">
          <div className="kiosk-card p-10">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border-4 border-green-400/30 shadow-green-500/50 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-heading font-800 text-white mb-2">Check-in Berhasil!</h2>
            <p className="text-white/60 mb-1">{name}</p>
            {!isOnline && <p className="text-yellow-400 text-xs mt-2 italic">(Disimpan offline)</p>}
            <button onClick={resetKiosk} className="mt-8 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-colors border border-white/20 cursor-pointer w-full">
              Kembali ke Awal
            </button>
          </div>
        </div>
      )}

      {/* ===== BLACKLIST SCREEN ===== */}
      {screen === 'blacklist' && (
        <div className="text-center max-w-sm mx-auto animate-fade-in">
          <div className="kiosk-card p-10 border border-red-500/30 shadow-red-500/30 shadow-lg">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 border-4 border-red-400/30 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h2 className="text-3xl font-heading font-800 text-red-400 mb-2">Akses Ditolak</h2>
            <p className="text-white/50 mb-6 text-sm">Pengunjung ini terdaftar dalam daftar pembatasan. Security telah diberitahu.</p>
            <button onClick={resetKiosk} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-colors border border-white/20 cursor-pointer w-full">
              Kembali ke Awal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}