# Firebase + Netlify Setup Guide — AnimePulse

## 1. أنشئ Firebase Project

1. اذهب إلى https://console.firebase.google.com
2. اضغط **Add project** → اسمه `animepulse`
3. أوقف Google Analytics → **Create project**

---

## 2. فعّل Firestore

1. من الشريط الجانبي اضغط **Firestore Database**
2. اضغط **Create database**
3. اختر **Start in production mode**
4. اختر منطقتك → **Enable**

---

## 3. ضع Firestore Rules

في Firestore → تبويب **Rules** — الصق هذا واضغط **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{id} {
      allow read: if true;
      allow write: if false;
    }
    match /meta/{id} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 4. احصل على Client Config

1. Firebase Console → ⚙️ Project Settings → **Your apps**
2. اضغط **</>** (Web) → سجّل التطبيق
3. انسخ قيم `firebaseConfig`

---

## 5. احصل على Service Account Key

1. Firebase Console → ⚙️ Project Settings → **Service Accounts**
2. اضغط **Generate new private key** → حمّل الـ JSON
3. افتح الملف وانسخ المحتوى كاملاً

---

## 6. أضف المتغيرات على Netlify

**Netlify → Site Settings → Environment Variables:**

| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | من الخطوة 4 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | من الخطوة 4 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | من الخطوة 4 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | من الخطوة 4 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | من الخطوة 4 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | من الخطوة 4 |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON كامل من الخطوة 5 في سطر واحد |
| `GEMINI_API_KEY` | من https://makersuite.google.com |
| `CRON_SECRET` | أي نص عشوائي مثل: `xK9mP2qR8nL5vT3w` |
| `NEXT_PUBLIC_SITE_URL` | رابط موقعك مثل: `https://animepulse.netlify.app` |

> ⚠️ `FIREBASE_SERVICE_ACCOUNT_KEY` يجب أن يكون في سطر واحد بدون مسافات أو أسطر جديدة

---

## 7. شغّل الأتوبايلوت أول مرة

بعد النشر، افتح هذا الرابط مرة واحدة:

```
https://your-site.netlify.app/api/autopilot?secret=YOUR_CRON_SECRET
```

ستظهر نتيجة مثل:
```json
{ "ok": true, "added": 12, "sources": { "rss": 5, "mal": 4, "reddit": 3 } }
```

---

## 8. الجدولة التلقائية

الملف `netlify/functions/scheduled-autopilot.ts` موجود وجاهز.
يعمل كل 6 ساعات تلقائياً بعد النشر على Netlify — **لا تحتاج أي خدمة خارجية**.

---

## Collections في Firestore

| Collection | المحتوى |
|---|---|
| `articles` | كل المقالات (حد أقصى 200) |
| `meta/trending` | بيانات الأنمي الترند |
| `meta/autopilot-status` | آخر تشغيل وإحصائيات |
