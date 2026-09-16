import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Globe2,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

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

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const row = item as Record<string, unknown>;

      const question =
        typeof row.question === "string" ? row.question : "";

      const options = Array.isArray(row.options)
        ? row.options.filter(
            (option): option is string => typeof option === "string",
          )
        : [];

      const answer =
        typeof row.answer === "string" ? row.answer : "";

      const explanation =
        typeof row.explanation === "string"
          ? row.explanation
          : undefined;

      if (!question || !options.length || !answer) return null;

      return {
        question,
        options,
        answer,
        explanation,
      };
    })
    .filter((item): item is MCQ => item !== null);
}

function formatDate(dateString: string, language: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString(
    language.startsWith("hi") ? "hi-IN" : "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
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

export function WeeklyCurrentAffairs() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const language = i18n.language?.toLowerCase() || "en";
  const isHindi = language.startsWith("hi");

  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    document.title = isHindi
      ? "डेली करंट अफेयर्स | Ranker Bhaiya"
      : "Daily Current Affairs | Ranker Bhaiya";
  }, [isHindi]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadCurrentAffairs = async () => {
      try {
        setLoading(true);
        setError("");

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Request timed out")),
            15000,
          ),
        );

        const query = supabase
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
          .order("affair_date", { ascending: false })
          .order("serial_no", { ascending: true });

        const { data, error: fetchError } = await Promise.race([
          query,
          timeout,
        ]);

        if (fetchError) throw fetchError;

        if (cancelled) return;

        const normalized: CurrentAffair[] = (data || []).map((row) => ({
          ...row,
          mcqs: normalizeMcqs(row.mcqs),
        }));

        setAffairs(normalized);
      } catch (err) {
        console.error("Current Affairs fetch error:", err);

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
    };

    loadCurrentAffairs();

    return () => {
      cancelled = true;
    };
  }, [user, isHindi]);

  const filteredAffairs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return affairs.filter((item) => {
      const categoryMatch =
        activeCategory === "All" ||
        item.category?.toLowerCase() === activeCategory.toLowerCase();

      if (!categoryMatch) return false;

      if (!query) return true;

      const searchableText = [
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

      return searchableText.includes(query);
    });
  }, [affairs, search, activeCategory]);

  const latestDate = affairs[0]?.affair_date;

  const getTitle = (item: CurrentAffair) => {
    if (isHindi && item.title_hi) return item.title_hi;
    return item.title;
  };

  const getWhyInNews = (item: CurrentAffair) => {
    if (isHindi && item.why_in_news_hi) {
      return item.why_in_news_hi;
    }

    return item.why_in_news;
  };

  const retry = () => {
    window.location.reload();
  };

  if (authLoading || (!user && loading)) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm opacity-70">
            {isHindi ? "लोड हो रहा है..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-slate-950/85"
            : "border-slate-200 bg-white/85"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/student/dashboard")}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              isDark
                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">
              {isHindi ? "डैशबोर्ड" : "Dashboard"}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {isHindi ? "आपका स्टडी पार्टनर" : "Your Study Partner"}
              </p>
              <p className="text-sm font-black tracking-tight">
                Ranker Bhaiya
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <BookOpen size={20} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 p-6 text-white shadow-2xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <Sparkles size={14} />
                {isHindi ? "डेली अपडेट" : "DAILY UPDATE"}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Globe2 size={14} />
                {isHindi ? "परीक्षा केंद्रित" : "Exam Focused"}
              </span>
            </div>

            <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              {isHindi
                ? "डेली करंट अफेयर्स"
                : "Daily Current Affairs"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
              {isHindi
                ? "महत्वपूर्ण राष्ट्रीय और अंतरराष्ट्रीय घटनाओं को पढ़ें, समझें और परीक्षा के लिए जरूरी पॉइंट्स को जल्दी रिवाइज करें।"
                : "Read, understand and revise important national and international events with exam-focused facts and MCQs."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-indigo-100">
                  <FileText size={15} />
                  {isHindi ? "कुल अपडेट" : "Total Updates"}
                </div>
                <p className="mt-1 text-2xl font-black">
                  {affairs.length}
                </p>
              </div>

              {latestDate && (
                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs text-indigo-100">
                    <CalendarDays size={15} />
                    {isHindi ? "नवीनतम" : "Latest"}
                  </div>
                  <p className="mt-1 text-sm font-black">
                    {formatDate(latestDate, language)}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-indigo-100">
                  <Trophy size={15} />
                  {isHindi ? "MCQs" : "MCQs"}
                </div>
                <p className="mt-1 text-2xl font-black">
                  {affairs.reduce(
                    (total, item) =>
                      total + normalizeMcqs(item.mcqs).length,
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mt-6">
          <div
            className={`rounded-2xl border p-3 shadow-sm ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="relative">
              <Search
                size={19}
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isHindi
                    ? "करंट अफेयर्स खोजें..."
                    : "Search current affairs..."
                }
                className={`w-full rounded-xl border py-3 pl-11 pr-11 text-sm outline-none transition ${
                  isDark
                    ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-indigo-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white"
                }`}
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 ${
                    isDark
                      ? "text-slate-400 hover:bg-white/10"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : isDark
                        ? "border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
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

        {/* Result info */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">
              {isHindi ? "आज के करंट अफेयर्स" : "Current Affairs"}
            </h2>
            <p
              className={`mt-1 text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {filteredAffairs.length}{" "}
              {isHindi ? "अपडेट मिले" : "updates found"}
            </p>
          </div>

          {(search || activeCategory !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600"
            >
              {isHindi ? "फ़िल्टर हटाएं" : "Clear filters"}
            </button>
          )}
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
                    isDark ? "bg-slate-800" : "bg-slate-200"
                  }`}
                />
                <div
                  className={`mt-5 h-6 w-4/5 rounded ${
                    isDark ? "bg-slate-800" : "bg-slate-200"
                  }`}
                />
                <div
                  className={`mt-3 h-4 w-full rounded ${
                    isDark ? "bg-slate-800" : "bg-slate-200"
                  }`}
                />
                <div
                  className={`mt-2 h-4 w-3/4 rounded ${
                    isDark ? "bg-slate-800" : "bg-slate-200"
                  }`}
                />
                <div
                  className={`mt-6 h-10 w-32 rounded-xl ${
                    isDark ? "bg-slate-800" : "bg-slate-200"
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
              ⚠️
            </div>

            <h3 className="mt-4 text-lg font-black">
              {isHindi ? "डेटा लोड नहीं हुआ" : "Unable to load data"}
            </h3>

            <p
              className={`mx-auto mt-2 max-w-md text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {error}
            </p>

            <button
              onClick={retry}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              {isHindi ? "दोबारा प्रयास करें" : "Try again"}
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredAffairs.length === 0 && (
          <div
            className={`mt-6 rounded-3xl border p-10 text-center ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                isDark ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <Search
                size={28}
                className={
                  isDark ? "text-slate-500" : "text-slate-400"
                }
              />
            </div>

            <h3 className="mt-5 text-lg font-black">
              {isHindi
                ? "कोई करंट अफेयर नहीं मिला"
                : "No current affairs found"}
            </h3>

            <p
              className={`mx-auto mt-2 max-w-md text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {isHindi
                ? "अपनी search या category बदलकर दोबारा देखें।"
                : "Try changing your search or category filter."}
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && filteredAffairs.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {filteredAffairs.map((item, index) => {
              const mcqs = normalizeMcqs(item.mcqs);
              const title = getTitle(item);
              const whyInNews = getWhyInNews(item);

              return (
                <article
                  key={item.id}
                  className={`group relative overflow-hidden rounded-3xl border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
                    isDark
                      ? "border-white/10 bg-slate-900 hover:border-indigo-500/30"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-indigo-500/5 blur-2xl transition group-hover:bg-indigo-500/10" />

                  <div className="relative">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
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

                      <div
                        className={`flex items-center gap-1.5 text-xs font-medium ${
                          isDark
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        <CalendarDays size={14} />
                        {formatDate(item.affair_date, language)}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 text-xl font-black leading-snug tracking-tight">
                      {title}
                    </h3>

                    {/* Why in News */}
                    {whyInNews && (
                      <div
                        className={`mt-4 rounded-2xl border p-4 ${
                          isDark
                            ? "border-white/5 bg-slate-950/60"
                            : "border-slate-100 bg-slate-50"
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-500">
                          <Clock size={14} />
                          {isHindi ? "चर्चा में क्यों" : "Why in News"}
                        </div>

                        <p
                          className={`line-clamp-3 text-sm leading-6 ${
                            isDark
                              ? "text-slate-300"
                              : "text-slate-600"
                          }`}
                        >
                          {stripHtml(whyInNews)}
                        </p>
                      </div>
                    )}

                    {/* Exam Point */}
                    {(item.exam_point || item.exam_point_hi) && (
                      <div className="mt-4 flex gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                          <Trophy size={16} />
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-emerald-500">
                            {isHindi ? "परीक्षा बिंदु" : "Exam Point"}
                          </p>

                          <p
                            className={`mt-1 line-clamp-2 text-sm leading-6 ${
                              isDark
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            {stripHtml(
                              isHindi && item.exam_point_hi
                                ? item.exam_point_hi
                                : item.exam_point,
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className={`mt-6 flex items-center justify-between border-t pt-4 ${
                        isDark
                          ? "border-white/10"
                          : "border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                            isDark
                              ? "bg-white/5 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <FileText size={14} />
                          {mcqs.length}{" "}
                          {isHindi ? "MCQs" : "MCQs"}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          navigate(
                            `/student/current-affairs/${item.id}`,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
                      >
                        {isHindi ? "पूरा पढ़ें" : "Read Full"}
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Newspaper Section */}
        <section className="mt-10">
          <div
            className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
                  <BookOpen size={25} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">
                      {isHindi
                        ? "डेली न्यूज़पेपर"
                        : "Daily Newspaper"}
                    </h2>

                    <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-purple-500">
                      {isHindi ? "Premium" : "Premium"}
                    </span>
                  </div>

                  <p
                    className={`mt-2 max-w-2xl text-sm leading-6 ${
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
              </div>

              <button
                onClick={() =>
                  navigate("/student/daily-newspaper")
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
              >
                {isHindi ? "न्यूज़पेपर खोलें" : "Open Newspaper"}
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* Exam Tip */}
        <section className="mt-6 pb-8">
          <div
            className={`rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-amber-500/10 bg-amber-500/5"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-xl">
                💡
              </div>

              <div>
                <h3 className="font-black">
                  {isHindi ? "Exam Tip" : "Exam Tip"}
                </h3>

                <p
                  className={`mt-1 text-sm leading-6 ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  {isHindi
                    ? "करंट अफेयर्स पढ़ते समय केवल खबर याद न करें। उससे जुड़े Static GK और Exam Point को भी जरूर रिवाइज करें।"
                    : "Don't just memorize the news. Revise the related Static GK and Exam Point to build stronger exam preparation."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-6 ${
          isDark
            ? "border-white/10 bg-slate-950"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p
            className={`text-xs ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            © {new Date().getFullYear()} Ranker Bhaiya •{" "}
            {isHindi
              ? "सीखें स्मार्ट, तैयारी करें बेहतर।"
              : "Learn smarter, prepare better."}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default WeeklyCurrentAffairs;
