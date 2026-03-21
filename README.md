# Liftygo — דשבורד שותפים

דשבורד למשווקי שותפים עם פרונטנד כווידג'ט חיצוני (סקריפט אחד לאלמנטור), ו-Backend מאובטח שמושך נתונים מ-Google Sheets בלי לחשוף מפתחות API בדף.

## מבנה המאגר

```
.
├── README.md
├── .gitignore
├── package.json         # תלות googleapis לפונקציית Vercel
├── api/                 # פונקציות שרת (Vercel) — קריאה ל-Google Sheets
├── frontend/
│   ├── embed.js         # נקודת הכניסה לאלמנטור: קובץ JS חיצוני אחד
│   └── dev.html         # דף בדיקה מקומית (לא לחשוף לייצור כ-URL ציבורי נדרש)
```

- **`frontend/embed.js`** — נטען בשורה אחת באלמנטור; יוצר את ה-DOM, קורא `utm_source`, מציג פילטר תאריכים וטבלה, וקורא ל-API ב-Backend.
- **`api/affiliate-data.js`** — קורא מ-Google Sheets עם Service Account מ-`GOOGLE_SERVICE_ACCOUNT_JSON` (רק ב-Vercel).

## הטמעה באלמנטור (שורה אחת)

העלה את `frontend/embed.js` ל-CDN או לתיקיית מדיה בוורדפרס, והדבק בווידג'ט HTML מותאם אישית:

```html
<script
  src="https://YOUR_DOMAIN/path/embed.js"
  data-api-base="https://YOUR_VERCEL_PROJECT.vercel.app/api"
  defer
></script>
```

- **`data-api-base`** — כתובת בסיס ל-API (ללא סלאש בסוף). אם לא מוגדר, הסקריפט ישתמש בערך ב-`window.AFFILIATE_DASHBOARD_API_BASE` אם קיים.

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

פתח את `frontend/dev.html` בדפדפן (או דרך שרת סטטי פשוט) כדי לבדוק את הווידג'ט. הוסף לכתובת פרמטרים לבדיקה, למשל: `?utm_source=demo_partner`.

## דרישות גיליון

שורה ראשונה = כותרות. חובה עמודות שמזוהות אוטומטית:

- **תאריך:** כותרת `date` או `תאריך`
- **שותף:** כותרת `utm_source`, `utm`, או `source` (הערך חייב להתאים ל-`utm_source` ב-URL)

אופציונלי: `note` / `הערות` — מוצג בעמודה השלישית בדשבורד.

הגיליון חייב להיות **משותף** עם אימייל ה-Service Account (`client_email` מה-JSON).

## רישיון

לפי הגדרת הבעלים של המאגר.
