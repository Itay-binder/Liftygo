# Liftygo

דשבורד לפי נתוני Google Sheets (קריאה בצד שרת בלבד). מסנן התחלתי לפי `utm_source`.

## הרצה מקומית

1. העתק `.env.example` ל־`.env.local` ומלא את הערכים.
2. בגוגל שיטס: שתף את הגיליון עם כתובת ה־**Service account** (`client_email` ב־JSON) — הרשאת צפייה מספיקה.
3. `npm install` ואז `npm run dev` — פתח [http://localhost:3000/embed](http://localhost:3000/embed).

## Vercel

ב־Project → Settings → Environment Variables הוסף:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — כל תוכן קובץ ה־JSON (מחרוזת אחת; מפתח `private_key` עם `\n`).
- `GOOGLE_SPREADSHEET_ID` — מזהה מה־URL של השיטס.
- אופציונלי: `GOOGLE_SHEET_RANGE` — אם שם הטאב או טווח העמודות שונים (ברירת מחדל: טאב MAKE ו־`A:AL`).

אחרי `git push`, הפריסה אמורה להיבנות אוטומטית.

## הטמעה ב־Elementor (מומלץ: iframe)

בווידג'ט HTML הדבק (החלף את הדומיין):

```html
<iframe
  src="https://YOUR-PROJECT.vercel.app/embed?utm_source=meta"
  width="100%"
  height="900"
  style="border:0;border-radius:12px;min-height:600px;"
  loading="lazy"
  title="Liftygo dashboard"
></iframe>
```

פרמטר `utm_source` ב־URL קובע סינון ראשוני; אפשר לשנות בשדה בדף.

**הערת אבטחה:** נתיב `/api/orders` פתוח כלעתה. לפני שיתוף רחב, כדאי להוסיף התחברות או מפתח סודי בכותרות — אפשר להרחיב בשלב הבא.
