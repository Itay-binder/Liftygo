import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ marginTop: 0 }}>Liftygo</h1>
        <p style={{ opacity: 0.85 }}>
          דשבורד למוטמע:{" "}
          <Link href="/embed">/embed</Link>
          <br />
          הוסף פרמטרים לסינון לפי מקור, לדוגמה:{" "}
          <code style={{ fontSize: 13 }}>?utm_source=meta</code>
        </p>
      </div>
    </main>
  );
}
