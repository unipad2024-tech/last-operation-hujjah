#!/usr/bin/env bash
# obsidian-tunnel.sh — يشغّل ngrok ويحدّث OBSIDIAN_HOST في Railway تلقائياً

NGROK="/c/Users/User/AppData/Local/Microsoft/WinGet/Packages/Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe/ngrok.exe"
PORT=27123

echo "▶  تشغيل ngrok على port $PORT..."

# أوقف أي ngrok قديم وانتظر حتى يغلق تماماً
pkill -f "ngrok" 2>/dev/null
taskkill //F //IM ngrok.exe 2>/dev/null
sleep 3

# شغّل ngrok في الخلفية
"$NGROK" http $PORT --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# انتظر حتى يصبح الـ tunnel جاهزاً
echo "⏳ انتظار الـ tunnel..."
for i in {1..15}; do
  sleep 1
  URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | node -e "
let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{
try{console.log(JSON.parse(d).tunnels[0].public_url)}catch(e){}
})" 2>/dev/null)
  if [ -n "$URL" ]; then
    break
  fi
done

if [ -z "$URL" ]; then
  echo "❌ فشل تشغيل ngrok — تأكد أن Obsidian شغّال على port $PORT"
  kill $NGROK_PID 2>/dev/null
  exit 1
fi

echo "✅ الـ tunnel شغّال: $URL"

# حدّث Railway
echo "🚂 تحديث OBSIDIAN_HOST في Railway..."
cd "$(dirname "$0")"
railway variables set OBSIDIAN_HOST="$URL" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ تم تحديث Railway بنجاح"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  OBSIDIAN_HOST = $URL"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🟢 جاهز! الـ sync يعمل تلقائياً الآن."
  echo "   اضغط Ctrl+C لإيقاف الـ tunnel"
  echo ""
  # أبقِ الـ script شغّالاً حتى Ctrl+C
  wait $NGROK_PID
else
  echo "❌ فشل تحديث Railway — تأكد أنك مسجّل دخول بـ: railway login"
  kill $NGROK_PID 2>/dev/null
  exit 1
fi
