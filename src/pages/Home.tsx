import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PILLAR_KEYS = ["syllabus", "ai", "video", "progress"] as const;

const PILLAR_ICONS = {
  syllabus: "📚",
  ai: "🤖",
  video: "🎥",
  progress: "📈",
} as const;

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-paper text-ink dark:bg-ink dark:text-paper">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-turmeric/10 blur-3xl dark:bg-turmeric/5" />

        <div className="pointer-events-none absolute -left-32 top-72 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl dark:bg-indigo-400/5" />

        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* LEFT */}
            <div>
              {/* Small badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur dark:border-paper/10 dark:bg-paper/5">
                <span className="h-2 w-2 rounded-full bg-turmeric" />
                <span>Ranker Bhaiya</span>
                <span className="text-ink/40 dark:text-paper/40">
                  •
                </span>
                <span className="text-ink-soft dark:text-paper/60">
                  Learn Smarter
                </span>
              </div>

              {/* Heading */}
              <h1 className="max-w-3xl font-sans text-5xl font-bold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                {t("home.heroTitle")}
              </h1>

              {/* Subtitle */}
              <p className="mt-7 max-w-2xl text-base leading-7 text-ink-soft dark:text-paper/70 sm:text-lg sm:leading-8">
                {t("home.heroSubtitle")}
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  to="/student/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-turmeric px-6 py-3.5 text-sm font-bold text-ink shadow-lg shadow-turmeric/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-turmeric-dark hover:shadow-xl"
                >
                  {t("home.ctaStudent")}

                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  to="/student/login"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-6 py-3.5 text-sm font-semibold text-ink shadow-sm transition-all hover:border-ink/20 hover:shadow-md dark:border-paper/10 dark:bg-paper/5 dark:text-paper dark:hover:border-paper/20"
                >
                  Explore Learning
                  <span>↗</span>
                </Link>
              </div>

              {/* Trust line */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-ink-soft dark:text-paper/50">
                <span className="flex items-center gap-2">
                  <span className="text-turmeric">✓</span>
                  Structured Learning
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-turmeric">✓</span>
                  AI-Powered Guidance
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-turmeric">✓</span>
                  Exam Focused
                </span>
              </div>
            </div>

            {/* RIGHT FEATURE CARD */}
            <div className="relative">
              <div className="relative mx-auto max-w-md">
                {/* Glow */}
                <div className="absolute inset-8 rounded-[2rem] bg-turmeric/20 blur-3xl dark:bg-turmeric/10" />

                <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-white p-6 shadow-2xl shadow-ink/10 dark:border-paper/10 dark:bg-paper/5 dark:shadow-black/20 sm:p-7">
                  {/* Top */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-turmeric-dark dark:text-turmeric">
                        Your Learning Hub
                      </p>

                      <h2 className="mt-1 text-xl font-bold">
                        Prepare with confidence
                      </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-turmeric/15 text-2xl">
                      🎯
                    </div>
                  </div>

                  {/* Ask Vidhya */}
                  <div className="mt-7 rounded-2xl border border-indigo-500/10 bg-indigo-50 p-5 dark:border-indigo-400/10 dark:bg-indigo-400/5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-600/20">
                        🤖
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Featured
                        </p>

                        <h3 className="mt-1 text-lg font-bold">
                          Ask Vidhya
                        </h3>

                        <p className="mt-1 text-sm leading-5 text-ink-soft dark:text-paper/60">
                          Your AI-powered learning assistant for doubts,
                          revision and smarter preparation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4 dark:border-paper/10 dark:bg-ink/40">
                      <div className="text-lg">📚</div>
                      <p className="mt-2 text-xs font-bold">Learn</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft dark:text-paper/50">
                        Smart content
                      </p>
                    </div>

                    <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4 dark:border-paper/10 dark:bg-ink/40">
                      <div className="text-lg">⚡</div>
                      <p className="mt-2 text-xs font-bold">Revise</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft dark:text-paper/50">
                        Fast revision
                      </p>
                    </div>

                    <div className="rounded-2xl border border-ink/10 bg-paper/70 p-4 dark:border-paper/10 dark:bg-ink/40">
                      <div className="text-lg">🏆</div>
                      <p className="mt-2 text-xs font-bold">Prepare</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft dark:text-paper/50">
                        Exam ready
                      </p>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-paper dark:bg-paper dark:text-ink">
                    <div>
                      <p className="text-xs font-bold">
                        Aapki Mehnat,
                      </p>
                      <p className="text-[11px] opacity-60">
                        Hamari Strategy.
                      </p>
                    </div>

                    <span className="text-xl">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              PILLARS
          ===================================================== */}

          <div className="mt-20 border-t border-ink/10 pt-8 dark:border-paper/10 sm:mt-24">
            <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-turmeric-dark dark:text-turmeric">
                  Everything in one place
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Built for smarter preparation
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-ink-soft dark:text-paper/50">
                Follow your preparation journey with focused tools designed
                to help you learn, revise and stay consistent.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILLAR_KEYS.map((key, index) => (
                <div
                  key={key}
                  className="group rounded-2xl border border-ink/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-paper/10 dark:bg-paper/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-turmeric/15 text-xl">
                      {PILLAR_ICONS[key]}
                    </div>

                    <span className="font-mono text-xs font-bold text-turmeric-dark dark:text-turmeric">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold leading-6 text-ink-soft dark:text-paper/75">
                    {t(`home.pillars.${key}`)}
                  </p>

                  <div className="mt-4 text-sm font-bold opacity-0 transition-opacity group-hover:opacity-100">
                    Explore →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BOTTOM CTA
      ===================================================== */}

      <section className="border-t border-ink/10 dark:border-paper/10">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-paper shadow-2xl dark:bg-paper dark:text-ink sm:px-10 sm:py-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-turmeric/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-turmeric">
                  Start your journey
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Learn smarter. Stay consistent. Prepare with confidence.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 opacity-65">
                  Ranker Bhaiya brings the right learning tools together
                  so you can focus on what actually matters.
                </p>
              </div>

              <Link
                to="/student/login"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-turmeric px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-turmeric-dark"
              >
                {t("home.ctaStudent")}
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
