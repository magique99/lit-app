import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7efe4] text-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="mb-6 text-4xl font-bold text-center">Literatura9</h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-700 max-w-2xl mx-auto">
          Un spațiu pentru autori care încă încearcă, pentru cititori care încă ascultă și pentru povești care refuză să plece imediat după ultima propoziție.
        </p>
        <div className="bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="mb-4 text-2xl font-semibold text-slate-950">Credința noastră</h2>
          <p className="mb-6 text-slate-600 leading-relaxed">
            Credem în textele imperfecte care încearcă ceva.
            În imaginile care rămân în minte fără explicații.
            În feedback sincer, fără cruzime.
            În literatura care nu se teme să fie fragilă, stranie sau incomodă.          
          </p>
        </div> 
        <div className="bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="mb-4 text-2xl font-semibold text-slate-950">Comunitate</h2>
          <p className="text-slate-600 leading-relaxed">
           - autori la început de drum
           - scriitori care vor feedback real
           - cititori curioși
           - oameni care caută literatură contemporană vie
           - cei care încă subliniază fraze doar pentru că le-a rămas ceva în piept
          </p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"> 
          <h2 className="mt-8 mb-4 text-2xl font-semibold text-slate-950">Misiunea noastră</h2>
          <p className="text-slate-600 leading-relaxed">
            Literatura9 s-a născut din dorința de a face loc acestor texte.
            Un spațiu pentru autori care încă încearcă, pentru cititori care încă ascultă și pentru povești care refuză să plece imediat după ultima propoziție.
            Aici literatura poate fi stranie, fragilă, imperfectă, intensă sau neterminată.
            Important este să fie vie.
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