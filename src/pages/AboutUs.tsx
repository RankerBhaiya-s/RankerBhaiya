import { Link } from "react-router-dom";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400"
          >
            Ranker Bhaiya
          </Link>

          <Link
            to="/"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-indigo-100">
            About Ranker Bhaiya
          </p>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            A Smarter Way to Prepare
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-indigo-50 sm:text-lg">
            Ranker Bhaiya is a student-focused learning platform built to make
            exam preparation simpler, smarter, and more effective.
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Who We Are */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-2xl font-black">Who We Are</h2>

            <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
              Ranker Bhaiya is a student-focused learning platform designed to
              make exam preparation simpler, smarter, and more effective.
            </p>

            <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
              We bring learning resources, current affairs, newspaper reading,
              fast revision, vocabulary building, practice tools, and
              AI-powered learning support together in one place.
            </p>

            <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
              Our focus is to help students learn with clarity, stay
              consistent, remain updated, and prepare for their exams with
              confidence.
            </p>
          </section>

          {/* What We Provide */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-2xl font-black">What We Provide</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                [
                  "📰",
                  "Daily Current Affairs",
                  "Stay updated with important events and exam-relevant information.",
                ],
                [
                  "📖",
                  "Newspaper Reading",
                  "Access useful newspaper content for regular reading and awareness.",
                ],
                [
                  "⚡",
                  "Fast Revision",
                  "Revise important concepts quickly and efficiently.",
                ],
                [
                  "🔤",
                  "Vocabulary Building",
                  "Improve English vocabulary, meanings, examples, and usage.",
                ],
                [
                  "🤖",
                  "Ask Vidhya",
                  "Get AI-powered learning support for your preparation.",
                ],
                [
                  "🎯",
                  "Practice & Challenges",
                  "Build consistency through questions, challenges, and preparation tools.",
                ],
              ].map(([icon, title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
                >
                  <div className="text-3xl">{icon}</div>

                  <h3 className="mt-3 font-black">{title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission */}
          <section className="rounded-3xl bg-indigo-50 p-6 dark:bg-indigo-950/40 sm:p-8">
            <h2 className="text-2xl font-black">Our Mission</h2>

            <p className="mt-4 leading-8 text-slate-700 dark:text-slate-300">
              Our mission is to help students learn smarter, stay updated,
              maintain consistency, and prepare for examinations with
              confidence.
            </p>

            <p className="mt-4 text-lg font-black text-indigo-700 dark:text-indigo-300">
              Aapki Mehnat, Hamari Strategy.
            </p>
          </section>

          {/* Founders */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                The Team Behind Ranker Bhaiya
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Meet Our Founders
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                Ranker Bhaiya is built with a vision to make learning more
                accessible, structured, and effective for students.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {/* Founder */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-black text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                  HS
                </div>

                <h3 className="mt-4 text-lg font-black">
                  Mr. Harsh Singh
                </h3>

                <p className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  M.B.A
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Founder
                </p>
              </div>

              {/* Co-Founder */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-black text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                  BK
                </div>

                <h3 className="mt-4 text-lg font-black">
                  Mr. Bankatesh Kumar
                </h3>

                <p className="mt-1 text-sm font-bold text-purple-600 dark:text-purple-400">
                  M.B.A
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Co-Founder
                </p>
              </div>

              {/* Co-Founder */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-2xl font-black text-pink-600 dark:bg-pink-900/50 dark:text-pink-300">
                  AK
                </div>

                <h3 className="mt-4 text-lg font-black">
                  Mr. Abhishek Kumar
                </h3>

                <p className="mt-1 text-sm font-bold text-pink-600 dark:text-pink-400">
                  B.C.A
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Co-Founder
                </p>
              </div>
            </div>
          </section>

          {/* Closing */}
          <section className="text-center">
            <h2 className="text-2xl font-black">
              Learn. Revise. Practice. Improve.
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
              Ranker Bhaiya is built to support you throughout your preparation
              journey.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Ranker Bhaiya. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-indigo-600">
              Contact Us
            </Link>

            <Link to="/privacy-policy" className="hover:text-indigo-600">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
