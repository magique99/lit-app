import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Pagina nu a fost găsită</h1>
        <p className="text-slate-600 mb-6">Postul solicitat nu există sau a fost șters.</p>
        <Link href="/" className="text-blue-600 underline">
          Înapoi la pagina principală
        </Link>
      </div>
    </div>
  );
}