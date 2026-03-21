# Liftygo — דשבורד שותפים

דשבורד למשווקי שותפים עם פרונטנד כווידג'ט חיצוני (סקריפט אחד לאלמנטור), ו-Backend מאובטח שמושך נתונים מ-Google Sheets בלי לחשוף מפתחות API בדף.

## מבנה המאגר

```
.
├── README.md
├── .gitignore
├── package.json         # תלות googleapis לפונקציית Vercel
├── api/                 # פונקציות שרת (Vercel) — קריאה ל-Google Sheets
├── public/
│   ├── embed.js         # נטען מ-Vercel כ־/embed.js (אלמנטור)
│   ├── index.html       # דף הסבר בשורש (לא 404)
│   └── dev.html         # בדיקה: /dev.html?utm_source=...
```

- **`public/embed.js`** — נטען בשורה אחת באלמנטור; ב-Vercel זמין ב־`https://YOUR_PROJECT.vercel.app/embed.js`.
- **`api/affiliate-data.js`** — קורא מ-Google Sheets עם Service Account מ-`GOOGLE_SERVICE_ACCOUNT_JSON` (רק ב-Vercel).

## הטמעה באלמנטור (שורה אחת)

אם הפרויקט ב-Vercel מחובר לריפו, אפשר להשתמש ישירות ב־`/embed.js` של אותו דומיין:

```html
<script
  src="https://YOUR_VERCEL_PROJECT.vercel.app/embed.js"
  data-api-base="https://YOUR_VERCEL_PROJECT.vercel.app/api"
  defer
></script>
```

חלופה: להעלות את `public/embed.js` למדיה בוורדפרס / CDN.

- **`data-api-base`** — כתובת בסיס ל-API (ללא סלאש בסוף). אם לא מוגדר, הסקריפט ישתמש ב־`window.AFFILIATE_DASHBOARD_API_BASE` אם קיים.

**הערה:** כתובת השורש `/` של פרויקט API-only עשויה הייתה להחזיר 404 לפני הוספת `public/index.html` — זה לא אומר שה-API שבור. לבדוק תמיד את `/api/affiliate-data?...`.

## Vercel — משתני סביבה (אחרי שהעלית את ה-JSON)

1. **`GOOGLE_SERVICE_ACCOUNT_JSON`** — כל תוכן קובץ ה-JSON (מחרוזת JSON תקינה). השם חייב להיות **בדיוק** כך (בלי נקודה או תו מיותר לפני/אחרי).
2. **`GOOGLE_SHEETS_SPREADSHEET_ID`** — מזהה הגיליון מה-URL:  
   `https://docs.google.com/spreadsheets/d/XXXXXXXX/edit` → ה-`XXXXXXXX`.
3. (אופציונלי) **`GOOGLE_SHEETS_RANGE`** — טווח קריאה, ברירת מחדל `Sheet1!A:Z`. אם הטאב שלך נקרא אחרת, למשל `Data!A:Z`.

אחרי שמירת המשתנים: **Deployments** → שלוש נקודות על הפריסה האחרונה → **Redeploy** (או commit חדש מגיטהאב).

## שלב נוכחי (UTM ונתונים)

1. זיהוי שותף לפי `utm_source` ב-`window.location.search`.
2. קריאה ל-`/api/affiliate-data` — סינון לפי `utm_source` וטווח תאריכים מהגיליון.

## שלבים הבאים (מתוכנן)

- אימות עם שם משתמש וסיסמה לכל לקוח.
- בניית Tailwind לייצור (build) במקום CDN, לביצועים ולשליטה במחלקות.

## פיתוח מקומי

מקומית: מתוך תיקיית `public` הרץ שרת סטטי (למשל `npx serve public`) ופתח `/dev.html?utm_source=demo_partner`. ב-Vercel: `https://YOUR_PROJECT.vercel.app/dev.html?utm_source=...` (הוסף `data-api-base` ב-HTML אם תרצה לבדוק מול API; לבדיקת API ישירות השתמש בכתובת `/api/affiliate-data`).

## דרישות גיליון

שורה ראשונה = כותרות. חובה עמודות שמזוהות אוטומטית:

- **תאריך:** כותרת `date` או `תאריך`
- **שותף:** כותרת `utm_source`, `utm`, או `source` (הערך חייב להתאים ל-`utm_source` ב-URL)

אופציונלי: `note` / `הערות` — מוצג בעמודה השלישית בדשבורד.

הגיליון חייב להיות **משותף** עם אימייל ה-Service Account (`client_email` מה-JSON).

## רישיון

לפי הגדרת הבעלים של המאגר.
