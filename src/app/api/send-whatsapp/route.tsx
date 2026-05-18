import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { target_phone, message } = body

  if (!target_phone || !message) {
    return NextResponse.json({ error: "Nomor dan pesan wajib diisi" }, { status: 400 })
  }

  const apiKey = process.env.FONNTE_API_KEY

  if (!apiKey) {
    console.error("FONNTE_API_KEY belum diset di environment variables")
    return NextResponse.json({ error: "Konfigurasi WA belum selesai" }, { status: 500 })
  }

  try {
    // Kirim request ke API Fonnte
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        target: target_phone,
        message: message
      })
    })

    const result = await response.json()
    
    if (result.status === false) {
      console.error("Fonnte Error:", result)
      return NextResponse.json({ error: "Gagal kirim WA", detail: result.reason }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fetch Fonnte Error:", error)
    return NextResponse.json({ error: "Server error saat kirim WA" }, { status: 500 })
  }
}