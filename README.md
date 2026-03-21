# Liftygo

דשבורד לפי נתוני Google Sheets (קריאה בצד שרת בלבד). מסנן התחלתי לפי `utm_source`.

## מבנה הריפו

הריפו מיועד למונורפו פנים־עסקי: כל פרויקט בתיקייה משלו.

- `affiliateDashboard/` — אפליקציית Next.js (דשבורד שותפים, `/embed`, API).

בשורש הריפו יש `package.json` עם **npm workspaces**; `npm install` פעם אחת בשורש מטפל בכל הפרויקטים.

## הרצה מקומית

1. העתק `affiliateDashboard/.env.example` ל־`affiliateDashboard/.env.local` ומלא את הערכים.
2. בגוגל שיטס: שתף את הגיליון עם כתובת ה־**Service account** (`client_email` ב־JSON) — הרשאת צפייה מספיקה.
3. `npm install` בשורש הריפו, ואז `npm run dev` — פתח [http://localhost:3000/embed](http://localhost:3000/embed).

## Vercel

ב־Project → Settings → **General** → **Root Directory** קבע `affiliateDashboard` (כדי שהבילד ירוץ על אפליקציית ה־Next).

ב־Project → Settings → Environment Variables הוסף:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — כל תוכן קובץ ה־JSON (מחרוזת אחת; מפתח `private_key` עם `\n`).
- `GOOGLE_SPREADSHEET_ID` — מזהה מה־URL של השיטס.
- אופציונלי: `GOOGLE_SHEET_RANGE` — אם שם הטאב או טווח העמודות שונים (ברירת מחדל: טאב MAKE ו־`A:AL`).
- אופציונלי: `GOOGLE_DATE_COLUMN` — שם מדויק של עמודת התאריך לסינון לפי זמן (ברירת מחדל: `תאריך הזמנה` או עמודה שמכילה «תאריך»).

אחרי `git push`, הפריסה אמורה להיבנות אוטומטית.

## הטמעה ב־Elementor (רוחב מלא + גובה דינמי)

הדף `/embed` מעוצב בהיר ונקי (מתאים לרקע לבן). אפשר להטמיע רק **iframe** — או iframe + סקריפט קטן שמתאים את **גובה** ה־iframe לתוכן (מומלץ).

החלף `https://liftygo.vercel.app` בכתובת הפרויקט שלך.

### גרסה מלאה (מומלץ — נראה “שטוח” ולא חתוך)

```html
<div class="liftygo-embed-wrap" style="width:100%;max-width:100%;margin:0;padding:0;line-height:0;">
  <iframe
    id="liftygo-embed-iframe"
    src="https://liftygo.vercel.app/embed"
    title="Liftygo"
    style="width:100%;border:0;display:block;min-height:560px;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,0.08);"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</div>
<script>
(function () {
  var iframe = document.getElementById("liftygo-embed-iframe");
  if (!iframe) return;
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "liftygo-embed-height") return;
    var h = parseInt(d.height, 10);
    if (h > 240) iframe.style.height = h + "px";
  });
})();
</script>
```

אם אלמנטור **מסיר את תגי `<script>`** — השתמש בווידג'ט “HTML” עם אפשרות סקריפטים, או הטמע רק את ה־`iframe` (ללא הסקריפט) והגדר `min-height` גבוה יותר (למשל `min-height:85vh`).

### גרסה פשוטה (רק iframe)

```html
<iframe
  src="https://liftygo.vercel.app/embed?utm_source=meta"
  width="100%"
  style="min-height:85vh;border:0;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,0.08);display:block;"
  loading="lazy"
  title="Liftygo"
></iframe>
```

פרמטר `utm_source` ב־URL קובע סינון ראשוני; אפשר לשנות בשדה בדף.

**הערת אבטחה:** נתיב `/api/orders` פתוח כלעתה. לפני שיתוף רחב, כדאי להוסיף התחברות או מפתח סודי בכותרות — אפשר להרחיב בשלב הבא.
