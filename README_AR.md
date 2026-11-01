# نظام اشتراك بدون تسجيل دخول — Supabase + Vercel

هذه نسخة مستقلة جاهزة للرفع على Vercel. لا تستبدل موقعك الحالي تلقائيًا؛ اختبرها على مشروع Vercel جديد أولًا.

## 1) إعداد Supabase
1. أنشئ مشروع Supabase.
2. افتح **SQL Editor** وشغّل الملف `supabase/schema.sql` كاملًا.
3. من **Project Settings → API** خذ Project URL و`service_role` key. مفتاح service role سري ولا تضعه في HTML أو GitHub.

## 2) رفع المشروع على Vercel
1. فك ضغط الملف.
2. ارفع الملفات إلى مستودع GitHub جديد.
3. في Vercel اختر **Add New → Project** ثم استورد المستودع.
4. أضف Environment Variables التالية من **Settings → Environment Variables**:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
   - `ADMIN_SECRET` = كلمة سر إدارية طويلة وعشوائية
5. اضغط **Redeploy** بعد حفظ المتغيرات.

## 3) إنشاء كود اشتراك بالطريقة السهلة
بعد نشر المشروع افتح `https://YOUR-DOMAIN.vercel.app/admin.html` في المتصفح. اكتب قيمة `ADMIN_SECRET` التي وضعتها في Vercel، وحدد مدة الاشتراك بالأيام، ثم اضغط **إنشاء كود اشتراك**. الصفحة لا تحفظ السر، بل ترسله للـ API عند الطلب فقط.

ويمكنك بدلًا من ذلك إنشاء كود من Terminal (غيّر الدومين والسر):

```bash
curl -X POST "https://YOUR-DOMAIN.vercel.app/api/admin-create-code" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"days":30}'
```

الرد يحتوي على كود صالح مرة واحدة. غيّر `days` لتحديد مدة مختلفة.

## 4) نقاط API
- `POST /api/status` — حالة الاشتراك للمتصفح الحالي.
- `POST /api/redeem` — تفعيل كود اشتراك.
- `POST /api/admin-create-code` — إنشاء كود، محمي بـ `ADMIN_SECRET`.

## مهم عن عدم وجود تسجيل دخول
النظام يربط الاشتراك بمعرّف عشوائي مخزن في `localStorage`، لذلك الاشتراك مرتبط بالمتصفح الحالي وليس بهوية شخص. مسح بيانات المتصفح أو الانتقال لجهاز آخر قد يفقد إمكانية استرجاع الاشتراك. لا تستخدمه كحماية قوية ضد مشاركة الاشتراك. لحماية أداة مدفوعة فعلًا، يجب أن تتحقق الوظائف الحساسة من حالة الاشتراك على السيرفر.

هذا القالب لا يتضمن تجاوز حماية SPRIX أو QUREO ولا أتمتة غير مصرح بها؛ استخدم فقط التكاملات المسموحة رسميًا.
