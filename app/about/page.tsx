import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7efe4] text-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="mb-6 text-4xl font-bold text-center">Despre Literatura9</h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-700 max-w-2xl mx-auto">
          Literatura9 este o platformă dedicată creatului literar, unde pasionaţii de scris pot să publiceze, să citească și să interacționeze cu o comunitate de cititori și autori. 
          Platforma susține diverse genuri literarî, de la proză și poezie până la teatru și jurnal, oferind un spațiu sigur și inspirant pentru expresia creativă.
        </p>
        <div className="bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="mb-4 text-2xl font-semibold text-slate-950">Misiunea noastră</h2>
          <p className="mb-6 text-slate-600 leading-relaxed">
            Să conectăm autori și cititori printr-o experiență intuitivă și atractivă, promovând diversitatea literară și încurajând discuții ponderate despre opere.
          </p>
          <h2 className="mb-4 text-2xl font-semibold text-slate-950">Cum funcționează</h2>
          <p className="text-slate-600 leading-relaxed">
            Orice utilizator înregistrat poate publica texte, să lase comentarii și să dă like la lucrările pe care le apreciază. Comentariile sunt moderețate pentru a menține un mediu respetuos și constructiv.
          </p>
        </div>
        <div className="mt-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
            Înapoi la pagină de început
          </Link>
        </div>
      </div>
    </main>
  );
}