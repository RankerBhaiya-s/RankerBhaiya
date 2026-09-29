import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";

interface VideoSeries {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  language: string | null;
  thumbnail_path: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface VideoPart {
  id: string;
  series_id: string;
  part_number: number;
  title: string;
  description: string | null;
  video_path: string;
  thumbnail_path: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_BUCKET = "short-videos";

export default function ShortVideos() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [series, setSeries] = useState<VideoSeries[]>([]);
  const [parts, setParts] = useState<VideoPart[]>([]);

  const [selectedSeries, setSelectedSeries] =
    useState<VideoSeries | null>(null);

  const [selectedPart, setSelectedPart] =
    useState<VideoPart | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingParts, setLoadingParts] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     LOAD SERIES
  ===================================================== */

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      setLoadingSeries(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("short_video_series")
        .select(`
          id,
          title,
          description,
          category,
          language,
          thumbnail_path,
          published,
          created_at,
          updated_at
        `)
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSeries(data ?? []);
    } catch (err) {
      console.error("Short video series error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load short videos."
      );
    } finally {
      setLoadingSeries(false);
    }
  };

  /* =====================================================
     LOAD PARTS
  ===================================================== */

  const loadParts = async (seriesItem: VideoSeries) => {
    try {
      setLoadingParts(true);
      setError("");

      setSelectedSeries(seriesItem);
      setSelectedPart(null);

      const { data, error: fetchError } = await supabase
        .from("short_video_parts")
        .select(`
          id,
          series_id,
          part_number,
          title,
          description,
          video_path,
          thumbnail_path,
          published,
          created_at,
          updated_at
        `)
        .eq("series_id", seriesItem.id)
        .eq("published", true)
        .order("part_number", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const loadedParts = data ?? [];

      setParts(loadedParts);

      if (loadedParts.length > 0) {
        setSelectedPart(loadedParts[0]);
      }
    } catch (err) {
      console.error("Short video parts error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load video parts."
      );
    } finally {
      setLoadingParts(false);
    }
  };

  /* =====================================================
     PUBLIC STORAGE URL
  ===================================================== */

  const getStorageUrl = (path: string | null) => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  };

  /* =====================================================
     FILTER
  ===================================================== */

  const categories = useMemo(() => {
    const values = series
      .map((item) => item.category)
      .filter(
        (value): value is string =>
          Boolean(value && value.trim())
      );

    return Array.from(new Set(values));
  }, [series]);

  const filteredSeries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return series.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" ||
        item.category?.toLowerCase() === category.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [series, search, category]);

  /* =====================================================
     PART NAVIGATION
  ===================================================== */

  const selectedPartIndex = selectedPart
    ? parts.findIndex((part) => part.id === selectedPart.id)
    : -1;

  const hasPrevious =
    selectedPartIndex > 0;

  const hasNext =
    selectedPartIndex >= 0 &&
    selectedPartIndex < parts.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      setSelectedPart(parts[selectedPartIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSelectedPart(parts[selectedPartIndex + 1]);
    }
  };

  const handleSelectSeries = (item: VideoSeries) => {
    loadParts(item);
  };

  const handleBackToSeries = () => {
    setSelectedSeries(null);
    setSelectedPart(null);
    setParts([]);
    setError("");
  };

  /* =====================================================
     SERIES THUMBNAIL
  ===================================================== */

  const getSeriesThumbnail = (item: VideoSeries) => {
    if (!item.thumbnail_path) return "";

    return getStorageUrl(item.thumbnail_path);
  };

  /* =====================================================
     PART THUMBNAIL
  ===================================================== */

  const getPartThumbnail = (part: VideoPart) => {
    if (!part.thumbnail_path) return "";

    return getStorageUrl(part.thumbnail_path);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loadingSeries) {
    return (
      <div
        className={`min-h-screen ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

            <p className="text-sm font-semibold opacity-70">
              Loading Short Videos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     SERIES VIEW
  ===================================================== */

  if (!selectedSeries) {
    return (
      <div
        className={`min-h-screen ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        {/* HEADER */}
        <header
          className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
            isDark
              ? "border-slate-800 bg-slate-950/90"
              : "border-slate-200 bg-white/90"
          }`}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 font-black text-white shadow-lg">
                RB
              </div>

              <div className="text-left">
                <div className="text-base font-black">
                  Ranker Bhaiya
                </div>

                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                  Short Videos
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/student/dashboard")}
              className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                isDark
                  ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              ← Dashboard
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest">
                🎬 Ranker Bhaiya
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Short Videos
              </h1>

              <p className="mt-3 text-sm leading-7 text-purple-100 sm:text-base">
                Important topics ko short, focused aur easy-to-understand
                video series mein learn karo.
              </p>
            </div>
          </section>

          {/* SEARCH */}
          <section className="mt-7">
            <div
              className={`rounded-2xl border p-3 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search video series..."
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:border-purple-500"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-purple-400"
                }`}
              />
            </div>

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setCategory("all")}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
                    category === "all"
                      ? "bg-purple-600 text-white"
                      : isDark
                      ? "bg-slate-900 text-slate-300"
                      : "bg-white text-slate-600"
                  }`}
                >
                  All
                </button>

                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
                      category.toLowerCase() ===
                      item.toLowerCase()
                        ? "bg-purple-600 text-white"
                        : isDark
                        ? "bg-slate-900 text-slate-300"
                        : "bg-white text-slate-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              ⚠️ {error}
            </div>
          )}

          {/* SERIES */}
          <section className="mt-7">
            {filteredSeries.length === 0 ? (
              <div
                className={`rounded-3xl border p-10 text-center ${
                  isDark
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="text-5xl">🎬</div>

                <h2 className="mt-4 text-lg font-black">
                  No video series found
                </h2>

                <p className="mt-2 text-sm opacity-60">
                  Abhi is category mein videos available nahi hain.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSeries.map((item) => {
                  const thumbnail = getSeriesThumbnail(item);

                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleSelectSeries(item)
                      }
                      className={`group overflow-hidden rounded-3xl border text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        isDark
                          ? "border-slate-800 bg-slate-900"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {/* THUMBNAIL */}
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">
                            🎬
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[10px] font-black text-white backdrop-blur">
                          ▶ WATCH SERIES
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2">
                          {item.category && (
                            <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-purple-600">
                              {item.category}
                            </span>
                          )}

                          {item.language && (
                            <span className="text-[10px] font-bold uppercase opacity-50">
                              {item.language}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 line-clamp-2 text-lg font-black">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-60">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs font-bold opacity-50">
                            Video Series
                          </span>

                          <span className="font-black text-purple-600 transition group-hover:translate-x-1">
                            →
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  /* =====================================================
     SERIES DETAIL / PLAYER
  ===================================================== */

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <button
            onClick={handleBackToSeries}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-xs font-black text-white">
              RB
            </div>

            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-black">
                {selectedSeries.title}
              </p>

              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                {parts.length} Parts
              </p>
            </div>
          </button>

          <button
            onClick={handleBackToSeries}
            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-black ${
              isDark
                ? "border-slate-700 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            ← All Videos
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* SERIES TITLE */}
        <section className="mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-purple-600">
            🎬 Video Series
          </p>

          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            {selectedSeries.title}
          </h1>

          {selectedSeries.description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 opacity-60">
              {selectedSeries.description}
            </p>
          )}
        </section>

        {loadingParts ? (
          <div
            className={`rounded-3xl border p-12 text-center ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />

            <p className="text-sm font-semibold opacity-60">
              Loading video parts...
            </p>
          </div>
        ) : parts.length === 0 ? (
          <div
            className={`rounded-3xl border p-12 text-center ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="text-5xl">🎬</div>

            <h2 className="mt-4 text-lg font-black">
              No published parts yet
            </h2>

            <p className="mt-2 text-sm opacity-60">
              Is series ke videos abhi publish nahi hue hain.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* ================= PLAYER ================= */}
            <div>
              <div
                className={`overflow-hidden rounded-3xl border ${
                  isDark
                    ? "border-slate-800 bg-black"
                    : "border-slate-200 bg-black"
                }`}
              >
                {selectedPart ? (
                  <video
                    key={selectedPart.id}
                    controls
                    playsInline
                    preload="metadata"
                    poster={
                      getPartThumbnail(selectedPart) ||
                      getSeriesThumbnail(selectedSeries) ||
                      undefined
                    }
                    className="aspect-video w-full bg-black"
                  >
                    <source
                      src={getStorageUrl(
                        selectedPart.video_path
                      )}
                      type="video/mp4"
                    />

                    Your browser does not support the video
                    player.
                  </video>
                ) : (
                  <div className="flex aspect-video items-center justify-center text-white">
                    <span className="text-sm opacity-60">
                      Select a video part
                    </span>
                  </div>
                )}
              </div>

              {/* CURRENT VIDEO INFO */}
              {selectedPart && (
                <div
                  className={`mt-4 rounded-3xl border p-5 ${
                    isDark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-purple-600">
                      Part {selectedPart.part_number}
                    </span>

                    <span className="text-xs font-bold opacity-40">
                      {selectedPartIndex + 1} of {parts.length}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black">
                    {selectedPart.title}
                  </h2>

                  {selectedPart.description && (
                    <p className="mt-2 text-sm leading-7 opacity-65">
                      {selectedPart.description}
                    </p>
                  )}

                  {/* PREVIOUS / NEXT */}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={handlePrevious}
                      disabled={!hasPrevious}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                        hasPrevious
                          ? isDark
                            ? "bg-slate-800 hover:bg-slate-700"
                            : "bg-slate-100 hover:bg-slate-200"
                          : "cursor-not-allowed bg-slate-500/10 opacity-30"
                      }`}
                    >
                      ← Previous
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                        hasNext
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "cursor-not-allowed bg-purple-500/10 text-purple-600 opacity-40"
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================= PART LIST ================= */}
            <aside>
              <div
                className={`overflow-hidden rounded-3xl border ${
                  isDark
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="border-b border-inherit p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-black">
                        Series Parts
                      </h2>

                      <p className="mt-1 text-xs opacity-50">
                        Watch in sequence
                      </p>
                    </div>

                    <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[10px] font-black text-purple-600">
                      {parts.length}
                    </span>
                  </div>
                </div>

                <div className="max-h-[620px] overflow-y-auto p-3">
                  <div className="space-y-2">
                    {parts.map((part) => {
                      const active =
                        selectedPart?.id === part.id;

                      const thumbnail =
                        getPartThumbnail(part);

                      return (
                        <button
                          key={part.id}
                          onClick={() =>
                            setSelectedPart(part)
                          }
                          className={`flex w-full gap-3 rounded-2xl p-2.5 text-left transition ${
                            active
                              ? isDark
                                ? "bg-purple-500/15 ring-1 ring-purple-500/40"
                                : "bg-purple-50 ring-1 ring-purple-200"
                              : isDark
                              ? "hover:bg-slate-800"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={part.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xl">
                                🎬
                              </div>
                            )}

                            <div className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-black text-white">
                              {part.part_number}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[10px] font-black uppercase tracking-wide ${
                                active
                                  ? "text-purple-600"
                                  : "opacity-45"
                              }`}
                            >
                              Part {part.part_number}
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5">
                              {part.title}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
