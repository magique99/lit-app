"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error' | 'submitting'>(null); // null, 'success', 'error'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    // Simulate an API call
    try {
      // In a real app, you would send the data to a backend here
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Simulate success
      setSubmitStatus('success');
      // Reset form
      setFormState({ name: "", email: "", message: "" });
    } catch (err) {
      setSubmitStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#f7efe4] text-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="mb-6 text-4xl font-bold text-center">Contactează-ne</h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-700 max-w-2xl mx-auto">
          Ai întrebări, sugestii sau dorești să colaborezi? Scrie-ne și vom răspunde în cel mai scurt timp posibil.
        </p>

        {/* Form */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Nume
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                Mesaj
              </label>
              <textarea
                id="message"
                name="message"
                value={formState.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <button
              type="submit"
              disabled={submitStatus === 'submitting'}
              className="w-full inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitStatus === 'submitting' ? 'Trimite...' : 'Trimite mesaj'}
            </button>
          </form>

          {/* Status message */}
          {submitStatus === 'success' && (
            <p className="mt-4 text-sm text-green-600 text-center">
              Mesajul a fost trimis cu succes! Vă vom contacta în curând.
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="mt-4 text-sm text-red-600 text-center">
              A apărut o eroare la trimitere. Vă rugăm să încercați din nou.
            </p>
          )}
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