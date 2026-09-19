// API Route ฝั่ง Server สำหรับยิงข้อความแจ้งเตือนไป Telegram
// เก็บ Bot Token ไว้ที่นี่เท่านั้น (ไม่มี NEXT_PUBLIC_ prefix) เพื่อไม่ให้หลุดไปที่ client bundle

export async function POST(request) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return Response.json(
      { ok: false, error: 'Telegram config missing on server' },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text) {
      return Response.json({ ok: false, error: 'text is required' }, { status: 400 });
    }

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await telegramRes.json();

    if (!telegramRes.ok) {
      return Response.json({ ok: false, error: data }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
