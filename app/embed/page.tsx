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
              "linear-gradient(160deg, #f1f5f9 0%, #e8eef5 45%, #f8fafc 100%)",
            color: "#64748b",
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
