import { redirect } from "next/navigation";

/** כניסה לדומיין הראשי מציגה ישר את הדשבורד (שדה utm_source + טבלה). */
export default function Home() {
  redirect("/embed");
}
