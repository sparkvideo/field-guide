import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page" style={{ paddingTop: 80 }}>
      <h1 className="text-[26px] font-bold">Page not found</h1>
      <p className="mt-4">
        <Link className="btn primary" href="/">
          Go to Home
        </Link>
      </p>
    </main>
  );
}
