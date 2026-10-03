import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type PaperSet = {
  id: string;
  set_number: number;
  title: string;
  description: string | null;
  year: number | null;
  question_count: number | null;
  storage_path: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function PreviousYearPapers() {
  const [papers, setPapers] = useState<PaperSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  useEffect(() => {
    fetchPapers();
  }, []);

  async function fetchPapers() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("previous_year_paper_sets")
      .select(`
        id,
        set_number,
        title,
        description,
        year,
        question_count,
        storage_path,
        published,
        created_at,
        updated_at
      `)
      .eq("published", true)
      .order("set_number", { ascending: true });

    if (fetchError) {
      console.error("Previous year papers fetch error:", fetchError);
      setError("Previous Year Papers load nahi ho paaye.");
      setPapers([]);
    } else {
      setPapers((data ?? []) as PaperSet[]);
    }

    setLoading(false);
  }

  const years = useMemo(() => {
    return Array.from(
      new Set(
        papers
          .map((paper) => paper.year)
          .filter((year): year is number => year !== null)
      )
    ).sort((a, b) => b - a);
  }, [papers]);

  const filteredPapers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return papers.filter((paper) => {
      const matchesSearch =
        !query ||
        paper.title.toLowerCase().includes(query) ||
        (paper.description ?? "").toLowerCase().includes(query) ||
        String(paper.set_number).includes(query) ||
        String(paper.year ?? "").includes(query);

      const matchesYear =
        yearFilter === "all" || String(paper.year) === yearFilter;

      return matchesSearch && matchesYear;
    });
  }, [papers, search, yearFilter]);

  async function openPaper(paper: PaperSet) {
    setOpeningId(paper.id);
    setError("");

    const { data, error: signedUrlError } = await supabase.storage
      .from("previous-year-papers")
      .createSignedUrl(paper.storage_path, 60 * 60);

    if (signedUrlError || !data?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      setError("Paper open nahi ho pa raha. Please try again.");
      setOpeningId(null);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    setOpeningId(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600" />

        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              📚 Ranker Bhaiya
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Previous Year Question Papers
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Practice previous year question paper sets and understand the
              pattern, difficulty and important question areas for your exam
              preparation.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black text-white">
                {papers.length}
              </p>
              <p className="mt-1 text-xs font-medium text-blue-100">
                Paper Sets
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black text-white">
                {years.length}
              </p>
              <p className="mt-1 text-xs font-medium text-blue-100">
                Years
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:block">
              <p className="text-2xl font-black text-white">PDF</p>
              <p className="mt-1 text-xs font-medium text-blue-100">
                Full Papers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search + filter */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Search Papers
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, set number or year..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Filter by Year
              </label>

              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="all">All Years</option>

                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />

                <div className="mt-5 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />

                <div className="mt-3 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />

                <div className="mt-2 h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />

                <div className="mt-6 h-11 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl dark:bg-blue-950/40">
              📄
            </div>

            <h2 className="mt-5 text-xl font-black">
              No Paper Sets Found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {papers.length === 0
                ? "Abhi koi Previous Year Paper published nahi hai."
                : "Search ya year filter ko change karke dobara try karo."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPapers.map((paper) => (
              <article
                key={paper.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Card top */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                      📄
                    </div>

                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                      SET {String(paper.set_number).padStart(3, "0")}
                    </span>
                  </div>

                  <h2 className="relative mt-5 line-clamp-2 text-xl font-black text-white">
                    {paper.title}
                  </h2>

                  {paper.year !== null && (
                    <p className="relative mt-2 text-sm font-semibold text-blue-100">
                      📅 {paper.year}
                    </p>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-6">
                  <p className="line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {paper.description ||
                      "Previous year question paper practice set for exam preparation."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-500">
                        Set
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                        #{String(paper.set_number).padStart(3, "0")}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-500">
                        Questions
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                        {paper.question_count ?? "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPaper(paper)}
                    disabled={openingId === paper.id}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-100"
                  >
                    {openingId === paper.id ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Opening...
                      </>
                    ) : (
                      <>📖 Open Question Paper</>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer note */}
        {!loading && papers.length > 0 && (
          <div className="mt-10 rounded-3xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex gap-3">
              <div className="text-xl">💡</div>

              <div>
                <h3 className="text-sm font-black text-blue-900 dark:text-blue-200">
                  Smart Practice Tip
                </h3>

                <p className="mt-1 text-sm leading-6 text-blue-800/80 dark:text-blue-300/80">
                  Pehle paper ko exam-like environment mein solve karo, phir
                  apni mistakes analyse karke weak topics ko revise karo.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
