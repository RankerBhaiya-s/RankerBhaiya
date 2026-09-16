import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";

interface MCQ {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface CurrentAffair {
  id: string;
  affair_date: string;
  serial_no: number | null;
  title: string;
  why_in_news: string | null;
  key_facts: string | null;
  exam_point: string | null;
  static_gk: string | null;
  mcqs: MCQ[] | unknown;
  published: boolean;
  category: string | null;

  title_hi: string | null;
  why_in_news_hi: string | null;
  key_facts_hi: string | null;
  exam_point_hi: string | null;
  static_gk_hi: string | null;
}

const categories = [
  "All",
  "National",
  "International",
  "Economy",
  "Science & Technology",
  "Environment",
  "Defence",
  "Sports",
  "Awards",
  "Appointments",
  "Government Schemes",
  "Reports & Index",
  "Important Days",
  "Other",
];

function normalizeMcqs(value: unknown): MCQ[] {
  if (!Array.isArray(value)) return [];

  const result: MCQ[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const row = item as Record<string, unknown>;

    const question =
      typeof row.question === "string"
        ? row.question
        : "";

    const options = Array.isArray(row.options)
      ? row.options.filter(
          (option): option is string =>
            typeof option === "string",
        )
      : [];

    const answer =
      typeof row.answer === "string"
        ? row.answer
        : "";

    const explanation =
      typeof row.explanation === "string"
        ? row.explanation
        : undefined;

    if (
      !question ||
      options.length === 0 ||
      !answer
    ) {
      continue;
    }

    result.push({
      question,
      options,
      answer,
      explanation,
    });
  }

  return result;
}

function stripHtml(value: string | null) {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(
  value: string,
  language: string,
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    language.startsWith("hi")
      ? "hi-IN"
      : "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

export function WeeklyCurrentAffairs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const language =
    i18n.language?.toLowerCase() || "en";

  const isHindi = language.startsWith("hi");

  const [affairs, setAffairs] = useState<
    CurrentAffair[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("All");

  useEffect(() => {
    document.title = isHindi
      ? "डेली करंट अफेयर्स | Ranker Bhaiya"
      : "Daily Current Affairs | Ranker Bhaiya";
  }, [isHindi]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/student/login", {
        replace: true,
      });
    }
  }, [
    authLoading,
    user,
    navigate,
  ]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadCurrentAffairs() {
      try {
        setLoading(true);
        setError("");

        const { data, error: fetchError } =
          await supabase
            .from("current_affairs")
            .select(
              `
                id,
                affair_date,
                serial_no,
                title,
                why_in_news,
                key_facts,
                exam_point,
                static_gk,
                mcqs,
                published,
                category,
                title_hi,
                why_in_news_hi,
                key_facts_hi,
                exam_point_hi,
                static_gk_hi
              `,
            )
            .eq("published", true)
            .order("affair_date", {
              ascending: false,
            })
            .order("serial_no", {
              ascending: true,
            });

        if (fetchError) {
          throw fetchError;
        }

        if (cancelled) return;

        const formatted: CurrentAffair[] =
          (data ?? []).map((row) => ({
            id: row.id,
            affair_date: row.affair_date,
            serial_no: row.serial_no,
            title: row.title,
            why_in_news:
              row.why_in_news ?? null,
            key_facts:
              row.key_facts ?? null,
            exam_point:
              row.exam_point ?? null,
            static_gk:
              row.static_gk ?? null,
            mcqs: normalizeMcqs(row.mcqs),
            published:
              row.published ?? true,
            category:
              row.category ?? null,
            title_hi:
              row.title_hi ?? null,
            why_in_news_hi:
              row.why_in_news_hi ?? null,
            key_facts_hi:
              row.key_facts_hi ?? null,
            exam_point_hi:
              row.exam_point_hi ?? null,
            static_gk_hi:
              row.static_gk_hi ?? null,
          }));

        setAffairs(formatted);
      } catch (err) {
        console.error(
          "Current Affairs error:",
          err,
        );

        if (!cancelled) {
          setError(
            isHindi
              ? "करंट अफेयर्स लोड नहीं हो पाए। कृपया दोबारा प्रयास करें।"
              : "Current affairs could not be loaded. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCurrentAffairs();

    return () => {
      cancelled = true;
    };
  }, [user, isHindi]);

  const filteredAffairs = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return affairs.filter((item) => {
      const categoryMatch =
        activeCategory === "All" ||
        item.category?.toLowerCase() ===
          activeCategory.toLowerCase();

      if (!categoryMatch) return false;

      if (!query) return true;

      const text = [
        item.title,
        item.title_hi,
        item.why_in_news,
        item.why_in_news_hi,
        item.key_facts,
        item.key_facts_hi,
        item.exam_point,
        item.exam_point_hi,
        item.static_gk,
        item.static_gk_hi,
        item.category,
      ]
        .map(stripHtml)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [
    affairs,
    search,
    activeCategory,
  ]);

  const totalMcqs = affairs.reduce(
    (total, item) =>
      total +
      normalizeMcqs(item.mcqs).length,
    0,
  );

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mb-4 text-5xl animate-pulse">
            📰
          </div>

          <p className="font-semibold">
            {isHindi
              ? "लोड हो रहा है..."
              : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() =>
              navigate("/student/dashboard")
            }
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              isDark
                ? "text-slate-300 hover:bg-white/10"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            ←
            <span className="hidden sm:inline">
              {isHindi
                ? "डैशबोर्ड"
                : "Dashboard"}
            </span>
          </button>

          <div className="text-right">
            <p className="font-black">
              Ranker Bhaiya
            </p>

            <p
              className={`text-xs ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              {isHindi
                ? "डेली करंट अफेयर्स"
                : "Daily Current Affairs"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 p-6 text-white shadow-2xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">
              ✨{" "}
              {isHindi
                ? "परीक्षा केंद्रित"
                : "EXAM FOCUSED"}
            </span>

            <h1 className="mt-5 text-3xl font-black sm:text-4xl">
              {isHindi
                ? "डेली करंट अफेयर्स"
                : "Daily Current Affairs"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
              {isHindi
                ? "महत्वपूर्ण राष्ट्रीय और अंतरराष्ट्रीय घटनाओं को पढ़ें, समझें और परीक्षा के लिए जरूरी पॉइंट्स को रिवाइज करें।"
                : "Read important national and international events with exam-focused facts and MCQs."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-indigo-100">
                  {isHindi
                    ? "कुल अपडेट"
                    : "Total Updates"}
                </p>

                <p className="mt-1 text-2xl font-black">
                  {affairs.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-indigo-100">
                  MCQs
                </p>

                <p className="mt-1 text-2xl font-black">
                  {totalMcqs}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mt-6">
          <div
            className={`rounded-2xl border p-3 ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                🔍
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  isHindi
                    ? "करंट अफेयर्स खोजें..."
                    : "Search current affairs..."
                }
                className={`w-full bg-transparent py-2 text-sm outline-none ${
                  isDark
                    ? "text-white placeholder:text-slate-500"
                    : "text-slate-900 placeholder:text-slate-400"
                }`}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-lg opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const active =
                activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() =>
                    setActiveCategory(category)
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-indigo-600 text-white"
                      : isDark
                        ? "border border-white/10 bg-slate-900 text-slate-300"
                        : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {category === "All"
                    ? isHindi
                      ? "सभी"
                      : "All"
                    : category}
                </button>
              );
            })}
          </div>
        </section>

        {/* Heading */}
        <div className="mt-7">
          <h2 className="text-xl font-black">
            {isHindi
              ? "करंट अफेयर्स"
              : "Current Affairs"}
          </h2>

          <p
            className={`mt-1 text-sm ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {filteredAffairs.length}{" "}
            {isHindi
              ? "अपडेट मिले"
              : "updates found"}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`animate-pulse rounded-3xl border p-6 ${
                  isDark
                    ? "border-white/10 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div
                  className={`h-4 w-24 rounded ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  }`}
                />

                <div
                  className={`mt-5 h-6 w-4/5 rounded ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  }`}
                />

                <div
                  className={`mt-3 h-4 w-full rounded ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-200"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className={`mt-6 rounded-3xl border p-8 text-center ${
              isDark
                ? "border-red-500/20 bg-red-500/5"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="text-4xl">
              ⚠️
            </div>

            <h3 className="mt-4 font-black">
              {isHindi
                ? "डेटा लोड नहीं हुआ"
                : "Unable to load data"}
            </h3>

            <p className="mt-2 text-sm opacity-70">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              {isHindi
                ? "दोबारा प्रयास करें"
                : "Try Again"}
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredAffairs.length === 0 && (
            <div
              className={`mt-6 rounded-3xl border p-10 text-center ${
                isDark
                  ? "border-white/10 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-5xl">
                🔎
              </div>

              <h3 className="mt-4 font-black">
                {isHindi
                  ? "कोई अपडेट नहीं मिला"
                  : "No updates found"}
              </h3>

              <p className="mt-2 text-sm opacity-60">
                {isHindi
                  ? "Search या category बदलकर देखें।"
                  : "Try changing your search or category."}
              </p>
            </div>
          )}

        {/* Cards */}
        {!loading &&
          !error &&
          filteredAffairs.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {filteredAffairs.map(
                (item, index) => {
                  const mcqs = normalizeMcqs(
                    item.mcqs,
                  );

                  const title =
                    isHindi && item.title_hi
                      ? item.title_hi
                      : item.title;

                  const why =
                    isHindi &&
                    item.why_in_news_hi
                      ? item.why_in_news_hi
                      : item.why_in_news;

                  const examPoint =
                    isHindi &&
                    item.exam_point_hi
                      ? item.exam_point_hi
                      : item.exam_point;

                  return (
                    <article
                      key={item.id}
                      className={`rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
                        isDark
                          ? "border-white/10 bg-slate-900"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-black text-indigo-500">
                            #{item.serial_no ?? index + 1}
                          </span>

                          {item.category && (
                            <span
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                isDark
                                  ? "bg-white/5 text-slate-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.category}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-xs ${
                            isDark
                              ? "text-slate-500"
                              : "text-slate-400"
                          }`}
                        >
                          📅{" "}
                          {formatDate(
                            item.affair_date,
                            language,
                          )}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-black leading-snug">
                        {title}
                      </h3>

                      {why && (
                        <div
                          className={`mt-4 rounded-2xl p-4 ${
                            isDark
                              ? "bg-slate-950"
                              : "bg-slate-50"
                          }`}
                        >
                          <p className="text-xs font-black uppercase tracking-wider text-indigo-500">
                            {isHindi
                              ? "चर्चा में क्यों"
                              : "Why in News"}
                          </p>

                          <p
                            className={`mt-2 line-clamp-3 text-sm leading-6 ${
                              isDark
                                ? "text-slate-300"
                                : "text-slate-600"
                            }`}
                          >
                            {stripHtml(why)}
                          </p>
                        </div>
                      )}

                      {examPoint && (
                        <div className="mt-4">
                          <p className="text-xs font-black uppercase tracking-wider text-emerald-500">
                            {isHindi
                              ? "परीक्षा बिंदु"
                              : "Exam Point"}
                          </p>

                          <p
                            className={`mt-1 line-clamp-2 text-sm leading-6 ${
                              isDark
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            {stripHtml(
                              examPoint,
                            )}
                          </p>
                        </div>
                      )}

                      <div
                        className={`mt-6 flex items-center justify-between border-t pt-4 ${
                          isDark
                            ? "border-white/10"
                            : "border-slate-100"
                        }`}
                      >
                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            isDark
                              ? "bg-white/5 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          📝 {mcqs.length} MCQs
                        </span>

                        <button
                          onClick={() =>
                            navigate(
                              `/student/current-affairs/${item.id}`,
                            )
                          }
                          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700"
                        >
                          {isHindi
                            ? "पूरा पढ़ें →"
                            : "Read Full →"}
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}

        {/* Newspaper */}
        <section className="mt-10 pb-8">
          <div
            className={`rounded-3xl border p-6 sm:p-8 ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">
                    {isHindi
                      ? "डेली न्यूज़पेपर"
                      : "Daily Newspaper"}
                  </h2>

                  <span className="rounded-full bg-purple-500/10 px-2 py-1 text-[10px] font-black text-purple-500">
                    PREMIUM
                  </span>
                </div>

                <p
                  className={`mt-2 text-sm leading-6 ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {isHindi
                    ? "हिंदी और अंग्रेज़ी न्यूज़पेपर पढ़ें और रोज़ की महत्वपूर्ण खबरों से अपडेट रहें।"
                    : "Read Hindi and English newspapers and stay updated with important daily news."}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    "/student/daily-newspaper",
                  )
                }
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-black text-white"
              >
                {isHindi
                  ? "न्यूज़पेपर खोलें →"
                  : "Open Newspaper →"}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer
        className={`border-t py-6 ${
          isDark
            ? "border-white/10"
            : "border-slate-200"
        }`}
      >
        <p
          className={`text-center text-xs ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          © {new Date().getFullYear()} Ranker Bhaiya
          {" • "}
          {isHindi
            ? "सीखें स्मार्ट, तैयारी करें बेहतर।"
            : "Learn smarter, prepare better."}
        </p>
      </footer>
    </div>
  );
}

export default WeeklyCurrentAffairs;
