import { Suspense } from "react";
import EmbedDashboard from "./EmbedDashboard";

export const dynamic = "force-dynamic";

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 16,
            minHeight: "40vh",
            background:
              "linear-gradient(160deg, var(--lg-50) 0%, var(--lg-100) 45%, var(--lg-surface) 100%)",
            color: "var(--lg-700)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          טוען דשבורד…
        </div>
      }
    >
      <EmbedDashboard />
    </Suspense>
  );
}
