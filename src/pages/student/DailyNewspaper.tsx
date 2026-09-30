import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { recordStudentActivity } from "../../lib/studentActivity";

type Paper = {
  id: string;
  newspaper_date: string;
  language: "hindi" | "english";
  paper_number: number;
  title: string;
  url: string;
};

export function DailyNewspaper() {
  const navigate = useNavigate();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadNewspapers();
  }, []);

  const loadNewspapers = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/student/login");
        return;
      }

      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL;

      const publishableKey =
        import.meta.env
          .VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "VITE_SUPABASE_URL missing hai.",
        );
      }

      /*
       * IMPORTANT:
       * Edge Function ko direct fetch se call kar rahe hain.
       */
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-newspapers`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,

            ...(publishableKey
              ? {
                  apikey: publishableKey,
                }
              : {}),
          },
        },
      );

      /*
       * Response text pehle read karte hain.
       * Isse agar Edge Function HTML/text/error return kare
       * to bhi actual error dikhega.
       */
      const responseText =
        await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        console.error(
          "Invalid Edge Function response:",
          responseText,
        );

        throw new Error(
          `Edge Function invalid response de raha hai. HTTP ${response.status}`,
        );
      }

      console.log(
        "get-published-newspapers:",
        {
          status: response.status,
          data,
        },
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Newspaper load nahi ho paya. HTTP ${response.status}`,
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Newspaper load nahi ho paya.",
        );
      }

      setPapers(
        Array.isArray(data.papers)
          ? data.papers
          : [],
      );
    } catch (err) {
      console.error(
        "Newspaper loading error:",
        err,
      );

      setPapers([]);

      setError(
        err instanceof Error
          ? err.message
          : "Newspaper load nahi ho paya.",
      );
    } finally {
      setLoading(false);
    }
  };

  const groupedDates = useMemo(() => {
    const groups: Record<
      string,
      {
        hindi: Paper[];
        english: Paper[];
      }
    > = {};

    for (const paper of papers) {
      if (
        paper.language !== "hindi" &&
        paper.language !== "english"
      ) {
        continue;
      }

      if (!groups[paper.newspaper_date]) {
        groups[paper.newspaper_date] = {
          hindi: [],
          english: [],
        };
      }

      groups[paper.newspaper_date][
        paper.language
      ].push(paper);
    }

    return Object.entries(groups).sort(
      ([dateA], [dateB]) =>
        dateB.localeCompare(dateA),
    );
  }, [papers]);

  const formatDate = (date: string) => {
    const parsedDate = new Date(
      `${date}T00:00:00`,
    );

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  };

  const openPaper = async (url: string) => {
    if (!url) {
      setError(
        "Is newspaper ki file available nahi hai.",
      );
      return;
    }

    /*
     * Record Daily Newspaper activity
     * before opening the newspaper.
     */
    const activityResult =
      await recordStudentActivity({
        activityType: "daily_newspaper",
      });

    if (!activityResult.success) {
      console.error(
        "Failed to record Daily Newspaper activity:",
        activityResult.error,
      );
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

          <div>
            <h1 className="text-2xl font-bold text-blue-600">
              Ranker Bhaiya
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Daily Newspaper
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-5xl px-4 py-8">

        <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/50 dark:bg-slate-900">

          {/* TITLE */}
          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="text-4xl">
                📰
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                Daily Newspaper
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Hindi & English newspapers with
                all previous published dates.
              </p>
            </div>

            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
              ACTIVE
            </span>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-center dark:bg-slate-800">

              <div className="text-3xl">
                📰
              </div>

              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Newspapers loading...
              </p>

            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

              <p className="font-semibold">
                Newspaper load nahi hua
              </p>

              <p className="mt-2 break-words text-sm">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadNewspapers();
                }}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Retry
              </button>

            </div>
          )}

          {/* NO PAPERS */}
          {!loading &&
            !error &&
            papers.length === 0 && (
              <div className="mt-8 rounded-2xl bg-blue-50 p-6 text-center dark:bg-blue-950/30">

                <div className="text-4xl">
                  📰
                </div>

                <h3 className="mt-3 font-semibold">
                  Newspaper abhi available nahi hai
                </h3>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Admin jab newspaper publish
                  karega, tab yahan automatically
                  dikhega.
                </p>

              </div>
            )}

          {/* NEWSPAPERS */}
          {!loading &&
            !error &&
            groupedDates.length > 0 && (
              <div className="mt-8 space-y-8">

                {groupedDates.map(
                  ([date, languages]) => (
                    <section
                      key={date}
                      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"
                    >

                      {/* DATE HEADER */}
                      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">

                        <h3 className="text-lg font-bold">
                          📅 {formatDate(date)}
                        </h3>

                      </div>

                      <div className="grid gap-6 p-5 md:grid-cols-2">

                        {/* HINDI */}
                        <div>

                          <div className="mb-4 flex items-center justify-between">

                            <h4 className="text-lg font-bold">
                              🇮🇳 Hindi
                            </h4>

                            {languages.hindi.length >
                              0 && (
                              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                                {
                                  languages.hindi
                                    .length
                                }{" "}
                                Paper
                                {languages.hindi
                                  .length > 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}

                          </div>

                          {languages.hindi.length ===
                            0 && (
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                              <p className="text-sm text-slate-400">
                                Hindi paper available
                                nahi hai.
                              </p>
                            </div>
                          )}

                          <div className="space-y-3">

                            {languages.hindi.map(
                              (paper) => (
                                <button
                                  key={paper.id}
                                  type="button"
                                  onClick={() => {
                                    void openPaper(
                                      paper.url,
                                    );
                                  }}
                                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                                >

                                  <div className="min-w-0">

                                    <p className="font-semibold">
                                      📄 Paper{" "}
                                      {
                                        paper.paper_number
                                      }
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                      {paper.title}
                                    </p>

                                  </div>

                                  <span className="ml-4 shrink-0 text-sm font-semibold text-blue-600">
                                    Open →
                                  </span>

                                </button>
                              ),
                            )}

                          </div>

                        </div>

                        {/* ENGLISH */}
                        <div>

                          <div className="mb-4 flex items-center justify-between">

                            <h4 className="text-lg font-bold">
                              🇬🇧 English
                            </h4>

                            {languages.english.length >
                              0 && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                {
                                  languages.english
                                    .length
                                }{" "}
                                Paper
                                {languages.english
                                  .length > 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}

                          </div>

                          {languages.english.length ===
                            0 && (
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                              <p className="text-sm text-slate-400">
                                English paper available
                                nahi hai.
                              </p>
                            </div>
                          )}

                          <div className="space-y-3">

                            {languages.english.map(
                              (paper) => (
                                <button
                                  key={paper.id}
                                  type="button"
                                  onClick={() => {
                                    void openPaper(
                                      paper.url,
                                    );
                                  }}
                                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                                >

                                  <div className="min-w-0">

                                    <p className="font-semibold">
                                      📄 Paper{" "}
                                      {
                                        paper.paper_number
                                      }
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                      {paper.title}
                                    </p>

                                  </div>

                                  <span className="ml-4 shrink-0 text-sm font-semibold text-blue-600">
                                    Open →
                                  </span>

                                </button>
                              ),
                            )}

                          </div>

                        </div>

                      </div>

                    </section>
                  ),
                )}

              </div>
            )}

          {/* INFO */}
          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">

            <h3 className="font-semibold">
              What you'll get
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                📰 Daily important news
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                📅 Previous published dates
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                🇮🇳 Multiple Hindi papers
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                🇬🇧 Multiple English papers
              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

export default DailyNewspaper;
