import { Rubik } from "next/font/google";

/** תואם לדף הבית — כולל עברית */
export const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-rubik",
});
