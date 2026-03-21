import { Suspense } from "react";
import EmbedDashboard from "./EmbedDashboard";

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 16, minHeight: "40vh" }}>טוען דשבורד…</div>
      }
    >
      <EmbedDashboard />
    </Suspense>
  );
}
