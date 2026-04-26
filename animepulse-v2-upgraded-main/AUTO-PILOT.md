# AnimePulse Auto-Pilot System

## 🤖 ما هو نظام Auto-Pilot؟

نظام يعمل تلقائياً لـ:
1. 📡 **جلب أخبار الأنمي** من RSS sources
2. ✨ **توليد محتوى AI** باستخدام Gemini
3. 📱 **نشر على Telegram** تلقائياً
4. 🔄 **تحديث الموقع** بأخبار جديدة

## 📁 الملفات الأساسية

| الملف | الوصف |
|-------|-------|
| `lib/rssParser.ts` | جلب الأخبار من مصادر RSS |
| `lib/gemini.ts` | توليد محتوى AI بـ Gemini |
| `lib/telegram.ts` | نشر على Telegram |
| `scripts/auto-pilot.ts` | السكريبت الرئيسي |

## 🚀 تشغيل يدوي

### تشغيل كامل:
```bash
cd /home/neyflex/.openclaw/workspace/animepulse
npx ts-node scripts/auto-pilot.ts
```

### تشغيل مهمة محددة:
```bash
# جلب أخبار فقط
npx ts-node scripts/auto-pilot.ts news

# تحديث Trending
npx ts-node scripts/auto-pilot.ts trending

# اختبار Telegram
npx ts-node scripts/auto-pilot.ts test
```

## ⏰ جدولة تلقائية (Cron Job)

### الخيار 1: OpenClaw Cron (مستحسن)

```bash
cron action=add job='{
  "name": "AnimePulse News Fetcher",
  "schedule": {"kind": "cron", "expr": "0 */6 * * *", "tz": "America/Los_Angeles"},
  "payload": {
    "kind": "agentTurn",
    "message": "cd /home/neyflex/.openclaw/workspace/animepulse && npx ts-node scripts/auto-pilot.ts",
    "model": "default",
    "thinking": "off",
    "runTimeoutSeconds": 300
  },
  "sessionTarget": "isolated",
  "enabled": true
}'
```

### الخيار 2: Cron تقليدي (Linux/Mac)

أضف هذا السطر إلى crontab:

```bash
# فتح crontab
crontab -e

# إضافة:
0 */6 * * * cd /home/neyflex/.openclaw/workspace/animepulse && npx ts-node scripts/auto-pilot.ts >> logs/auto-pilot.log 2>&1
```

هذا يشغل النظام كل 6 ساعات:
- `0 */6 * * *` = في دقيقة 0 من كل 6 ساعات

### جداول أخرى:

```bash
# كل ساعة
0 * * * *

# مرتين يومياً (6ص و6م)
0 6,18 * * *

# مرة واحدة يومياً (الصباح)
0 9 * * *

# كل 3 ساعات
0 */3 * * *
```

## 📊ما يفعله النظام

### 1. جلب الأخبار (RSS)
-_sources المستخدمة:
  - Crunchyroll News
  - Anime News Network
  - MyAnimeList News
  - Funimation Blog

### 2. توليد AI (Gemini)
- توليد مقالات كاملة من الأخبار
- إنشاء ملخصات
- اقتراح وسوم/تصنيفات

### 3. نشر Telegram
- منشور تلقائي للأخبار الجديدة
- تحديثات Trending يومية
- روابط للموقع

### 4. حفظ البيانات
يتم حفظ:
- `data/news.json` - قائمة الأخبار
- `data/trending.json` - الترندات
- `data/auto-pilot.log` - سجل التشغيل

## 🔧 التخصيص

### تغيير مصادر RSS:

في ملف `lib/rssParser.ts`:

```typescript
const RSS_SOURCES = [
  {
    name: 'Your Source Name',
    url: 'https://example.com/feed.xml',
    category: 'News',
  },
  // أضف مصادرك هنا
];
```

### تغيير عدد الأخبار:

في `scripts/auto-pilot.ts`:

```typescript
// حالي:
for (const item of newsItems.slice(0, 3)) { // أول 3 أخبار

// تغيير لـ 5:
for (const item of newsItems.slice(0, 5)) { // أول 5 أخبار
```

### تخصيص قالب Telegram:

في `lib/telegram.ts`، عدل دالة `sendToTelegram`.

## 📋 متطلبات الـ API

### Gemini API:
- احصل على مفتاحك من: https://aistudio.google.com
- ضعه في `.env.local`: `GEMINI_API_KEY=your_key`

### Telegram Bot:
- أنشئ بوت عبر @BotFather
- ضع التوكن في `.env.local`: `TELEGRAM_BOT_TOKEN=your_token`
- ضع معرف القناة: `TELEGRAM_CHANNEL_ID=your_channel_id`

## ⚠️ ملاحظات مهمة

### اختبار قبل التشغيل:
```bash
# اختبار Telegram
npx ts-node scripts/auto-pilot.ts test

# تشغيل مرة واحدة يدوياً
npx ts-node scripts/auto-pilot.ts news
```

### مراقبة السجلات:
```bash
# سجلات التشغيل
cat data/auto-pilot.log

# آخر 20 سطر
tail -20 data/auto-pilot.log
```

### مشاكل شائعة:

1. **"Cannot find module"**: تأكد من `npm install`
2. **"No Gemini API key"**: لن يتوقف، يستخدم fallback
3. **"Telegram failed"**: يتجاهل ويكمل

## 🎉 النتيجة

بعد التشغيل:
- ✅ موقعك يتحدث محتواه تلقائياً
- ✅ Telegram ينشر أخبار يومياً
- ✅ محتوى AI احترافي
- ✅ لا حاجة لتدخل يدوي!

---

هل تبي أساعدك في تشغيل اختباري أو إعداد الـ cron job؟
