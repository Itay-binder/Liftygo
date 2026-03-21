import { EmbedBodyClass } from "./EmbedBodyClass";
import "./embed.css";

export const dynamic = "force-dynamic";

/** אין redirect בשרת — iframe + Bearer; אימות ב־EmbedDashboard וב־API */
export default async function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EmbedBodyClass />
      {children}
    </>
  );
}
