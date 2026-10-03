import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import { recordStudentActivity } from "../../lib/studentActivity";

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

type CalendarMode = "date" | "month";

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

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function formatDate(
  value: string,
  language: string,
) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

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

function formatMonthYear(
  year: number,
  month: number,
  language: string,
) {
  const date = new Date(year, month, 1);

  return date.toLocaleDateString(
    language.startsWith("hi")
      ? "hi-IN"
      : "en-IN",
    {
      month: "long",
      year: "numeric",
    },
  );
}

function formatMonthShort(
  year: number,
  month: number,
  language: string,
) {
  const date = new Date(year, month, 1);

  return date.toLocaleDateString(
    language.startsWith("hi")
      ? "hi-IN"
      : "en-IN",
    {
      month: "short",
    },
  );
}

function parseDateFromSearch(
  value: string,
): string | null {
  const raw = value.trim().toLowerCase();

  if (!raw) return null;

  // YYYY-MM-DD
  const isoMatch = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(month).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const numericMatch = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
  );

  if (numericMatch) {
    const day = Number(numericMatch[1]);
    const month = Number(numericMatch[2]);
    const year = Number(numericMatch[3]);

    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(month).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;
    }
  }

  const months: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  // DD Month YYYY
  const textDateMatch = raw.match(
    /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/,
  );

  if (textDateMatch) {
    const day = Number(textDateMatch[1]);
    const monthName = textDateMatch[2];
    const year =
      Number(textDateMatch[3]) ||
      new Date().getFullYear();

    const month = months[monthName];

    if (
      month !== undefined &&
      day >= 1 &&
      day <= 31
    ) {
      return `${year}-${String(month + 1).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

function isMonthMatch(
  dateValue: string,
  year: number,
  month: number,
) {
  return (
    dateValue.slice(0, 4) === String(year) &&
    Number(dateValue.slice(5, 7)) === month + 1
  );
}

function getCalendarDays(
  year: number,
  month: number,
) {
  const firstDay = new Date(
    year,
    month,
    1,
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  // Convert Sunday-first to Monday-first.
  const mondayOffset =
    firstDay === 0 ? 6 : firstDay - 1;

  const cells: Array<number | null> = [];

  for (let i = 0; i < mondayOffset; i++) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  return cells;
}

function getMonthKey(
  year: number,
  month: number,
) {
  return `${year}-${String(month + 1).padStart(
    2,
    "0",
  )}`;
}

export function WeeklyCurrentAffairs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, loading: authLoading } =
    useAuth();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const language =
    i18n.language?.toLowerCase() || "en";

  const isHindi = language.startsWith("hi");

  const today = getLocalDateString();

  const todayDate = new Date();

  const [affairs, setAffairs] = useState<
    CurrentAffair[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [calendarOpen, setCalendarOpen] =
    useState(false);

  const [calendarMode, setCalendarMode] =
    useState<CalendarMode>("date");

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] =
    useState<{
      year: number;
      month: number;
    } | null>(null);

  const [calendarYear, setCalendarYear] =
    useState(todayDate.getFullYear());

  const [calendarMonth, setCalendarMonth] =
    useState(todayDate.getMonth());

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

  /*
   * Search/date/month/category filtering
   *
   * Rules:
   * 1. Nothing selected + no search = TODAY ONLY
   * 2. Date selected = selected date
   * 3. Month selected = selected month
   * 4. Keyword search = ALL DATES
   * 5. Date/month + keyword = combined filter
   */
  const filteredAffairs = useMemo(() => {
    const rawSearch =
      search.trim().toLowerCase();

    const searchDate =
      parseDateFromSearch(rawSearch);

    const isDateSearch =
      Boolean(searchDate);

    return affairs.filter((item) => {
      const categoryMatch =
        activeCategory === "All" ||
        item.category?.toLowerCase() ===
          activeCategory.toLowerCase();

      if (!categoryMatch) {
        return false;
      }

      /*
       * Search query itself is a date.
       * Example:
       * 29 Sep 2026
       * 29/09/2026
       * 29-09-2026
       */
      if (isDateSearch && searchDate) {
        return item.affair_date === searchDate;
      }

      /*
       * Explicit calendar date.
       */
      if (
        selectedDate &&
        item.affair_date !== selectedDate
      ) {
        return false;
      }

      /*
       * Explicit calendar month.
       */
      if (
        selectedMonth &&
        !isMonthMatch(
          item.affair_date,
          selectedMonth.year,
          selectedMonth.month,
        )
      ) {
        return false;
      }

      /*
       * Keyword search.
       * If keyword exists, it searches ALL dates
       * unless date/month filter is explicitly selected.
       */
      if (rawSearch) {
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

        return text.includes(rawSearch);
      }

      /*
       * No search and no date/month selection:
       * TODAY ONLY.
       */
      if (
        !selectedDate &&
        !selectedMonth
      ) {
        return item.affair_date === today;
      }

      return true;
    });
  }, [
    affairs,
    search,
    activeCategory,
    selectedDate,
    selectedMonth,
    today,
  ]);

  const totalMcqs = affairs.reduce(
    (total, item) =>
      total +
      normalizeMcqs(item.mcqs).length,
    0,
  );

  /*
   * Dates which actually contain affairs.
   */
  const affairDates = useMemo(() => {
    return new Set(
      affairs.map(
        (item) => item.affair_date,
      ),
    );
  }, [affairs]);

  /*
   * Month has content?
   */
  const affairMonths = useMemo(() => {
    const months = new Set<string>();

    for (const item of affairs) {
      months.add(
        item.affair_date.slice(0, 7),
      );
    }

    return months;
  }, [affairs]);

  /*
   * Group results by date.
   */
  const groupedAffairs = useMemo(() => {
    const groups = new Map<
      string,
      CurrentAffair[]
    >();

    for (const item of filteredAffairs) {
      const existing =
        groups.get(item.affair_date) ?? [];

      existing.push(item);

      groups.set(
        item.affair_date,
        existing,
      );
    }

    return Array.from(groups.entries()).sort(
      (a, b) =>
        b[0].localeCompare(a[0]),
    );
  }, [filteredAffairs]);

  const hasSearch =
    search.trim().length > 0;

  const hasCalendarFilter =
    Boolean(
      selectedDate || selectedMonth,
    );

  const isTodayView =
    !hasSearch &&
    !hasCalendarFilter;

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        calendarYear,
        calendarMonth,
      ),
    [calendarYear, calendarMonth],
  );

  const monthKey = getMonthKey(
    calendarYear,
    calendarMonth,
  );

  const monthHasAffairs =
    affairMonths.has(monthKey);

  const resetFilters = () => {
    setSearch("");
    setSelectedDate(null);
    setSelectedMonth(null);

    setCalendarYear(
      todayDate.getFullYear(),
    );

    setCalendarMonth(
      todayDate.getMonth(),
    );

    setCalendarMode("date");
    setCalendarOpen(false);
  };

  const handleDateSelect = (
    year: number,
    month: number,
    day: number,
  ) => {
    const dateString = `${year}-${String(
      month + 1,
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0",
    )}`;

    setSelectedDate(dateString);
    setSelectedMonth(null);
    setSearch("");
    setCalendarOpen(false);
  };

  const handleMonthSelect = (
    year: number,
    month: number,
  ) => {
    setSelectedMonth({
      year,
      month,
    });

    setSelectedDate(null);
    setSearch("");
    setCalendarOpen(false);
  };

  const goToPreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(
        calendarYear - 1,
      );
    } else {
      setCalendarMonth(
        calendarMonth - 1,
      );
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(
        calendarYear + 1,
      );
    } else {
      setCalendarMonth(
        calendarMonth + 1,
      );
    }
  };

  const goToToday = () => {
    setCalendarYear(
      todayDate.getFullYear(),
    );

    setCalendarMonth(
      todayDate.getMonth(),
    );

    setSelectedDate(null);
    setSelectedMonth(null);
    setSearch("");
    setCalendarOpen(false);
  };

  const activeFilterLabel = useMemo(() => {
    if (selectedDate) {
      return formatDate(
        selectedDate,
        language,
      );
    }

    if (selectedMonth) {
      return formatMonthYear(
        selectedMonth.year,
        selectedMonth.month,
        language,
      );
    }

    return "";
  }, [
    selectedDate,
    selectedMonth,
    language,
  ]);

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

        {/* Search + Calendar */}
        <section className="relative z-30 mt-6">
          <div
            className={`rounded-2xl border p-3 ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search */}
              <div
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 ${
                  isDark
                    ? "border-white/10 bg-slate-950"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-xl">
                  🔍
                </span>

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value,
                    );

                    /*
                     * Typing a keyword/date search
                     * removes explicit calendar filter.
                     * The user can then use calendar again
                     * for combined filtering.
                     */
                    if (
                      event.target.value.trim()
                    ) {
                      setSelectedDate(null);
                      setSelectedMonth(null);
                    }
                  }}
                  placeholder={
                    isHindi
                      ? "Keyword या date खोजें..."
                      : "Search keyword or date..."
                  }
                  className={`w-full bg-transparent py-3 text-sm outline-none ${
                    isDark
                      ? "text-white placeholder:text-slate-500"
                      : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />

                {search && (
                  <button
                    onClick={() =>
                      setSearch("")
                    }
                    className="text-lg opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Calendar Button */}
              <button
                onClick={() =>
                  setCalendarOpen(
                    (value) => !value,
                  )
                }
                className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${
                  calendarOpen ||
                  hasCalendarFilter
                    ? "bg-indigo-600 text-white"
                    : isDark
                      ? "bg-white/5 text-slate-200 hover:bg-white/10"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                📅
                <span>
                  {hasCalendarFilter
                    ? activeFilterLabel
                    : isHindi
                      ? "Calendar"
                      : "Calendar"}
                </span>
              </button>
            </div>

            {/* Active filter */}
            {(hasCalendarFilter ||
              hasSearch) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {hasSearch && (
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      isDark
                        ? "bg-indigo-500/10 text-indigo-300"
                        : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    🔎 {search}
                  </span>
                )}

                {selectedDate && (
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      isDark
                        ? "bg-purple-500/10 text-purple-300"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    📅{" "}
                    {formatDate(
                      selectedDate,
                      language,
                    )}
                  </span>
                )}

                {selectedMonth && (
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      isDark
                        ? "bg-purple-500/10 text-purple-300"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    📅{" "}
                    {formatMonthYear(
                      selectedMonth.year,
                      selectedMonth.month,
                      language,
                    )}
                  </span>
                )}

                <button
                  onClick={resetFilters}
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10"
                >
                  {isHindi
                    ? "रीसेट"
                    : "Reset"}
                </button>
              </div>
            )}
          </div>

          {/* Calendar Popup */}
          {calendarOpen && (
            <div
              className={`absolute left-0 right-0 mt-3 rounded-3xl border p-5 shadow-2xl ${
                isDark
                  ? "border-white/10 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Calendar top */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black">
                    📆{" "}
                    {isHindi
                      ? "Date Navigator"
                      : "Date Navigator"}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      isDark
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    {isHindi
                      ? "Date या पूरे महीने के Current Affairs देखें"
                      : "Browse Current Affairs by date or month"}
                  </p>
                </div>

                <div
                  className={`flex rounded-xl p-1 ${
                    isDark
                      ? "bg-slate-950"
                      : "bg-slate-100"
                  }`}
                >
                  <button
                    onClick={() =>
                      setCalendarMode("date")
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-black ${
                      calendarMode === "date"
                        ? "bg-indigo-600 text-white"
                        : isDark
                          ? "text-slate-400"
                          : "text-slate-600"
                    }`}
                  >
                    📅{" "}
                    {isHindi
                      ? "तारीख"
                      : "Date"}
                  </button>

                  <button
                    onClick={() =>
                      setCalendarMode("month")
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-black ${
                      calendarMode === "month"
                        ? "bg-indigo-600 text-white"
                        : isDark
                          ? "text-slate-400"
                          : "text-slate-600"
                    }`}
                  >
                    🗓️{" "}
                    {isHindi
                      ? "महीना"
                      : "Month"}
                  </button>
                </div>
              </div>

              {/* Calendar navigation */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={
                    goToPreviousMonth
                  }
                  className={`rounded-xl px-3 py-2 text-lg font-black ${
                    isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-slate-100"
                  }`}
                >
                  ‹
                </button>

                <div className="text-center">
                  <p className="text-lg font-black">
                    {formatMonthYear(
                      calendarYear,
                      calendarMonth,
                      language,
                    )}
                  </p>

                  {monthHasAffairs && (
                    <p className="mt-1 text-[11px] font-bold text-emerald-500">
                      ●{" "}
                      {isHindi
                        ? "अफेयर्स उपलब्ध हैं"
                        : "Affairs available"}
                    </p>
                  )}
                </div>

                <button
                  onClick={
                    goToNextMonth
                  }
                  className={`rounded-xl px-3 py-2 text-lg font-black ${
                    isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-slate-100"
                  }`}
                >
                  ›
                </button>
              </div>

              {calendarMode ===
                "date" ? (
                <>
                  {/* Week days */}
                  <div className="mt-5 grid grid-cols-7 gap-1.5">
                    {[
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ].map((day) => (
                      <div
                        key={day}
                        className={`py-2 text-center text-[10px] font-black uppercase ${
                          isDark
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map(
                      (day, index) => {
                        if (
                          day === null
                        ) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="h-11"
                            />
                          );
                        }

                        const dateString = `${calendarYear}-${String(
                          calendarMonth +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}-${String(
                          day,
                        ).padStart(
                          2,
                          "0",
                        )}`;

                        const hasAffair =
                          affairDates.has(
                            dateString,
                          );

                        const isSelected =
                          selectedDate ===
                          dateString;

                        const isToday =
                          today ===
                          dateString;

                        return (
                          <button
                            key={
                              dateString
                            }
                            onClick={() =>
                              handleDateSelect(
                                calendarYear,
                                calendarMonth,
                                day,
                              )
                            }
                            className={`relative flex h-11 items-center justify-center rounded-xl text-sm font-bold transition ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : isToday
                                  ? isDark
                                    ? "border border-indigo-400 bg-indigo-500/10 text-indigo-300"
                                    : "border border-indigo-300 bg-indigo-50 text-indigo-700"
                                  : isDark
                                    ? "hover:bg-white/10"
                                    : "hover:bg-slate-100"
                            }`}
                          >
                            {day}

                            {hasAffair && (
                              <span
                                className={`absolute bottom-1 h-1 w-1 rounded-full ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-emerald-500"
                                }`}
                              />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div
                    className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${
                      isDark
                        ? "border-white/10"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {isHindi
                          ? "अफेयर्स उपलब्ध"
                          : "Affairs available"}
                      </span>

                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        {isHindi
                          ? "आज"
                          : "Today"}
                      </span>
                    </div>

                    <button
                      onClick={
                        goToToday
                      }
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white"
                    >
                      {isHindi
                        ? "आज"
                        : "Today"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Month selector */}
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from(
                      { length: 12 },
                      (_, month) => {
                        const key =
                          getMonthKey(
                            calendarYear,
                            month,
                          );

                        const hasContent =
                          affairMonths.has(
                            key,
                          );

                        const isSelected =
                          selectedMonth?.year ===
                            calendarYear &&
                          selectedMonth?.month ===
                            month;

                        return (
                          <button
                            key={month}
                            onClick={() =>
                              handleMonthSelect(
                                calendarYear,
                                month,
                              )
                            }
                            className={`relative rounded-xl px-3 py-4 text-sm font-bold transition ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : isDark
                                  ? "bg-slate-950 text-slate-300 hover:bg-white/10"
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {formatMonthShort(
                              calendarYear,
                              month,
                              language,
                            )}

                            {hasContent && (
                              <span
                                className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-emerald-500"
                                }`}
                              />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div
                    className={`mt-5 flex items-center justify-between border-t pt-4 ${
                      isDark
                        ? "border-white/10"
                        : "border-slate-100"
                    }`}
                  >
                    <button
                      onClick={
                        goToToday
                      }
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white"
                    >
                      {isHindi
                        ? "आज"
                        : "Today"}
                    </button>

                    <p className="text-[11px] opacity-60">
                      {isHindi
                        ? "महीने पर क्लिक करके पूरा महीना देखें"
                        : "Select a month to view all affairs"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Categories */}
        <section className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(
              (category) => {
                const active =
                  activeCategory ===
                  category;

                return (
                  <button
                    key={category}
                    onClick={() =>
                      setActiveCategory(
                        category,
                      )
                    }
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-indigo-600 text-white"
                        : isDark
                          ? "border border-white/10 bg-slate-900 text-slate-300"
                          : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {category ===
                    "All"
                      ? isHindi
                        ? "सभी"
                        : "All"
                      : category}
                  </button>
                );
              },
            )}
          </div>
        </section>

        {/* Heading */}
        <div className="mt-7">
          {isTodayView ? (
            <>
              <h2 className="text-xl font-black">
                📅{" "}
                {isHindi
                  ? `आज — ${formatDate(
                      today,
                      language,
                    )}`
                  : `Today — ${formatDate(
                      today,
                      language,
                    )}`}
              </h2>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {isHindi
                  ? "Today's Current Affairs"
                  : "Today's Current Affairs"}
              </p>
            </>
          ) : hasSearch ? (
            <>
              <h2 className="text-xl font-black">
                🔎{" "}
                {isHindi
                  ? "Search Results"
                  : "Search Results"}
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
            </>
          ) : selectedDate ? (
            <>
              <h2 className="text-xl font-black">
                📅{" "}
                {formatDate(
                  selectedDate,
                  language,
                )}
              </h2>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {isHindi
                  ? "इस तारीख के Current Affairs"
                  : "Current Affairs for this date"}
              </p>
            </>
          ) : selectedMonth ? (
            <>
              <h2 className="text-xl font-black">
                🗓️{" "}
                {formatMonthYear(
                  selectedMonth.year,
                  selectedMonth.month,
                  language,
                )}
              </h2>

              <p
                className={`mt-1 text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {isHindi
                  ? "महीने के सभी Current Affairs"
                  : "All Current Affairs for this month"}
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map(
              (item) => (
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
              ),
            )}
          </div>
        )}

        {/* Error */}
        {!loading &&
          error && (
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
          filteredAffairs.length ===
            0 && (
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
                {isTodayView
                  ? isHindi
                    ? "आज के लिए कोई Current Affairs उपलब्ध नहीं है।"
                    : "No Current Affairs are available for today."
                  : isHindi
                    ? "Search, date, month या category बदलकर देखें।"
                    : "Try changing your search, date, month, or category."}
              </p>

              {!isTodayView && (
                <button
                  onClick={
                    resetFilters
                  }
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
                >
                  {isHindi
                    ? "आज के अपडेट देखें"
                    : "Back to Today"}
                </button>
              )}
            </div>
          )}

        {/* Grouped Results */}
        {!loading &&
          !error &&
          filteredAffairs.length >
            0 && (
            <div className="mt-6 space-y-8">
              {groupedAffairs.map(
                (
                  [
                    date,
                    dateAffairs,
                  ],
                ) => (
                  <section
                    key={date}
                  >
                    {/* Date heading only when multiple dates */}
                    {groupedAffairs.length >
                      1 && (
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg">
                          📅
                        </div>

                        <div>
                          <h3 className="font-black">
                            {formatDate(
                              date,
                              language,
                            )}
                          </h3>

                          <p
                            className={`text-xs ${
                              isDark
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {
                              dateAffairs.length
                            }{" "}
                            {isHindi
                              ? "updates"
                              : "updates"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                      {dateAffairs.map(
                        (
                          item,
                          index,
                        ) => {
                          const mcqs =
                            normalizeMcqs(
                              item.mcqs,
                            );

                          const title =
                            isHindi &&
                            item.title_hi
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
                              key={
                                item.id
                              }
                              className={`rounded-3xl border p-5 transition hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
                                isDark
                                  ? "border-white/10 bg-slate-900"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-black text-indigo-500">
                                    #
                                    {item.serial_no ??
                                      index +
                                        1}
                                  </span>

                                  {item.category && (
                                    <span
                                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                        isDark
                                          ? "bg-white/5 text-slate-300"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {
                                        item.category
                                      }
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
                                    {stripHtml(
                                      why,
                                    )}
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
                                  📝{" "}
                                  {
                                    mcqs.length
                                  }{" "}
                                  MCQs
                                </span>

                                <button
                                  onClick={async () => {
                                    const result =
                                      await recordStudentActivity(
                                        {
                                          userId:
                                            user.id,
                                          activityType:
                                            "current_affairs",
                                        },
                                      );

                                    if (
                                      !result.success
                                    ) {
                                      console.error(
                                        "Failed to record Current Affairs activity:",
                                        result.error,
                                      );
                                    }

                                    navigate(
                                      `/student/current-affairs/${item.id}`,
                                    );
                                  }}
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
                  </section>
                ),
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
