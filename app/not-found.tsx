import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">404 - Pagina nu a fost găsită</h1>
        <p className="text-slate-600 mb-6">
          Postul solicitat nu există sau a fost șters. Verifică dacă ești logat corect și dacă postul a fost salvat.
        </p>
        <div className="space-y-2">
          <Link href="/" className="text-blue-600 underline block">
            Înapoi la pagina principală
          </Link>
          <Link href="/texte" className="text-blue-600 underline block">
            Vezi toate textele
          </Link>
          <Link href="/create" className="text-blue-600 underline block">
            Creează un text nou
          </Link>
        </div>
      </div>
    </div>
  );
}