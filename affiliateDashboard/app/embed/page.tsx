import { Suspense } from "react";
import EmbedDashboard from "./EmbedDashboard";

export const dynamic = "force-dynamic";

export default function EmbedPage() {
  return (
    <Suspense
      fallback={<div className="lg-embed-suspense-fallback">טוען דשבורד…</div>}
    >
      <EmbedDashboard />
    </Suspense>
  );
}
