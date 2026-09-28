import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";

interface NoteStyle {
  id: string;
  name: string;
  font: string;
  description: string;
}

interface NoteSection {
  title: string;
  content: string;
  points: string[];
}

interface NotePage {
  pageNumber: number;
  sections: NoteSection[];
}

interface HandwrittenNotesLocationState {
  topic?: string;
  content?: string;
  source?: string;
}

const NOTE_STYLES: NoteStyle[] = [
  {
    id: "classic",
    name: "Classic Notes",
    font: '"Comic Sans MS", "Segoe Print", cursive',
    description: "Clean school-notebook style",
  },
  {
    id: "study",
    name: "Study Notes",
    font: '"Segoe Print", "Comic Sans MS", cursive',
    description: "Natural handwritten look",
  },
  {
    id: "exam",
    name: "Exam Revision",
    font: '"Bradley Hand", "Comic Sans MS", cursive',
    description: "Quick revision style",
  },
];

const DEMO_CONTENT = `Photosynthesis is the process by which green plants prepare their own food using sunlight, carbon dioxide and water.

This process mainly takes place in the green parts of plants because they contain chlorophyll.

Roots absorb water from the soil while carbon dioxide enters the leaves through tiny pores called stomata.

Chlorophyll captures sunlight and provides the energy needed for photosynthesis.

The food produced is mainly glucose, which can later be stored as starch.

Photosynthesis also releases oxygen into the atmosphere.

The process is extremely important because it provides food for plants and releases oxygen required by living organisms.`;

function cleanText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSectionsFromText(
  text: string,
  topic: string,
): NoteSection[] {
  const cleaned = cleanText(text);

  if (!cleaned) {
    return [
      {
        title: topic || "Study Notes",
        content: "No content available.",
        points: [],
      },
    ];
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const sourceBlocks =
    paragraphs.length > 0
      ? paragraphs
      : cleaned
          .split(/\n/)
          .map((item) => item.trim())
          .filter(Boolean);

  const sections: NoteSection[] = [];

  sourceBlocks.forEach((block, index) => {
    const sentences = splitSentences(block);

    let title = "";

    if (index === 0) {
      title = topic || "Introduction";
    } else if (sentences.length > 0) {
      title = sentences[0]
        .replace(/[.!?]+$/, "")
        .slice(0, 70);
    }

    if (!title) {
      title = `Important Point ${index + 1}`;
    }

    const points =
      sentences.length > 1
        ? sentences.slice(0, 4)
        : block
            .split(/[,;:]/)
            .map((item) => item.trim())
            .filter((item) => item.length > 10)
            .slice(0, 4);

    sections.push({
      title,
      content: block,
      points,
    });
  });

  return sections;
}

function createPagesFromText(
  text: string,
  topic: string,
): NotePage[] {
  const sections = createSectionsFromText(text, topic);

  const pages: NotePage[] = [];

  for (let i = 0; i < sections.length; i += 3) {
    pages.push({
      pageNumber: pages.length + 1,
      sections: sections.slice(i, i + 3),
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      sections: [
        {
          title: topic || "Study Notes",
          content: text || "No notes available.",
          points: [],
        },
      ],
    });
  }

  return pages;
}

function NotebookPage({
  page,
  topic,
  font,
  darkMode,
}: {
  page: NotePage;
  topic: string;
  font: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={`relative mx-auto min-h-[760px] w-full max-w-[820px] overflow-hidden rounded-[4px] border shadow-2xl ${
        darkMode
          ? "border-slate-700 bg-[#f8f4e8] text-slate-800"
          : "border-slate-300 bg-[#fffdf4] text-slate-800"
      }`}
      style={{
        fontFamily: font,
      }}
    >
      {/* Notebook top margin */}
      <div className="absolute left-0 right-0 top-0 h-10 bg-[#fffdf4]" />

      {/* Red notebook margin */}
      <div className="absolute bottom-0 left-[68px] top-0 w-[2px] bg-red-300/80" />

      {/* Blue ruled lines */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 34px, rgba(80,140,210,0.22) 35px)",
          backgroundPosition: "0 38px",
        }}
      />

      {/* Spiral holes */}
      <div className="absolute left-0 top-0 z-20 flex h-full w-[28px] flex-col items-center justify-around py-8">
        {Array.from({ length: 16 }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-4 rounded-full border-2 border-slate-500 bg-slate-200 shadow-inner"
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 px-12 pb-12 pl-[88px] pt-12">
        {/* Branding */}
        <div className="mb-7 flex items-start justify-between gap-4 border-b border-slate-300/70 pb-4">
          <div>
            <div className="text-[18px] font-black tracking-[0.08em] text-indigo-700">
              RANKER BHAIYA
            </div>

            <div className="mt-1 text-[13px] font-bold text-slate-500">
              ✍️ Ask Vidhya • Handwritten Study Notes
            </div>
          </div>

          <div className="rounded-full border-2 border-indigo-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-indigo-600">
            AI Notes
          </div>
        </div>

        {/* Topic */}
        <div className="mb-8">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Topic
          </div>

          <h1 className="text-3xl font-black leading-tight text-slate-900">
            {topic || "Study Notes"}
          </h1>
        </div>

        {/* Sections */}
        <div className="space-y-7">
          {page.sections.map((section, index) => (
            <section key={`${section.title}-${index}`}>
              <h2 className="mb-2 text-[22px] font-black leading-tight text-indigo-800">
                {section.title}
              </h2>

              <p className="whitespace-pre-line text-[17px] font-medium leading-[2.05] text-slate-700">
                {section.content}
              </p>

              {section.points.length > 0 && (
                <div className="mt-4 rounded-xl border-2 border-amber-300/80 bg-amber-50/80 p-4">
                  <div className="mb-2 text-sm font-black uppercase tracking-wider text-amber-700">
                    ⭐ Important Points
                  </div>

                  <ul className="space-y-2">
                    {section.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        className="flex gap-2 text-[15px] font-semibold leading-7 text-slate-700"
                      >
                        <span className="font-black text-indigo-600">
                          •
                        </span>

                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Exam box */}
        <div className="mt-8 rounded-2xl border-2 border-indigo-300 bg-indigo-50/80 p-5">
          <div className="mb-2 text-sm font-black uppercase tracking-wider text-indigo-700">
            🎯 Exam Revision
          </div>

          <p className="text-[15px] font-semibold leading-7 text-slate-700">
            Revise the highlighted concepts and important points before
            attempting practice questions.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-300 pt-4 text-xs font-bold text-slate-400">
          <span>RANKER BHAIYA</span>

          <span>
            ASK VIDHYA • PAGE {page.pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl dark:bg-indigo-950">
        {icon}
      </div>

      <h3 className="font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function HandwrittenNotes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const noteState =
    location.state as
      | HandwrittenNotesLocationState
      | null;

  const incomingTopic = noteState?.topic?.trim() || "";
  const incomingContent = noteState?.content?.trim() || "";

  const [topic, setTopic] = useState(
    incomingTopic || "Photosynthesis",
  );

  const [content, setContent] = useState(
    incomingContent || DEMO_CONTENT,
  );

  const [selectedStyle, setSelectedStyle] =
    useState("classic");

  const [pages, setPages] = useState<NotePage[]>(() =>
    createPagesFromText(
      incomingContent || DEMO_CONTENT,
      incomingTopic || "Photosynthesis",
    ),
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [generated, setGenerated] = useState(
    Boolean(incomingContent),
  );

  /*
   * Ask Vidhya se navigation hone par
   * topic/content automatically update karega.
   */
  useEffect(() => {
    if (!incomingContent && !incomingTopic) {
      return;
    }

    const nextTopic =
      incomingTopic || "AI Generated Notes";

    const nextContent =
      incomingContent || DEMO_CONTENT;

    setTopic(nextTopic);
    setContent(nextContent);
    setPages(
      createPagesFromText(
        nextContent,
        nextTopic,
      ),
    );
    setCurrentPage(0);
    setGenerated(true);
  }, [incomingTopic, incomingContent]);

  const activeStyle = useMemo(
    () =>
      NOTE_STYLES.find(
        (style) => style.id === selectedStyle,
      ) || NOTE_STYLES[0],
    [selectedStyle],
  );

  const darkMode = theme === "dark";

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();

    const cleanTopic =
      topic.trim() || "Study Notes";

    const cleanContent = cleanText(content);

    if (!cleanContent) {
      return;
    }

    const generatedPages = createPagesFromText(
      cleanContent,
      cleanTopic,
    );

    setTopic(cleanTopic);
    setContent(cleanContent);
    setPages(generatedPages);
    setCurrentPage(0);
    setGenerated(true);
  };

  const handleReset = () => {
    const defaultTopic = "Photosynthesis";
    const defaultContent = DEMO_CONTENT;

    setTopic(defaultTopic);
    setContent(defaultContent);
    setPages(
      createPagesFromText(
        defaultContent,
        defaultTopic,
      ),
    );
    setCurrentPage(0);
    setGenerated(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const text = [
      `RANKER BHAIYA`,
      `ASK VIDHYA - HANDWRITTEN STUDY NOTES`,
      ``,
      `TOPIC: ${topic}`,
      ``,
      content,
      ``,
      `Generated with Ranker Bhaiya • Ask Vidhya`,
    ].join("\n");

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${topic
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .replace(/^-+|-+$/g, "") || "ranker-bhaiya-notes"}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const handleBackToAskVidhya = () => {
    navigate("/student/ask");
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Print-only CSS */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .print-area {
              display: block !important;
            }

            .notebook-print-page {
              page-break-after: always;
            }

            @page {
              size: A4;
              margin: 0;
            }
          }
        `}
      </style>

      {/* Header */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBackToAskVidhya}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg">
              R
            </div>

            <div className="text-left">
              <div className="font-black tracking-wide text-slate-900 dark:text-white">
                RANKER BHAIYA
              </div>

              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ask Vidhya • Handwritten Notes
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleBackToAskVidhya}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Ask Vidhya
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="no-print overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_0.6fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur">
                ✍️ AI Handwritten Notes
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Turn your Ask Vidhya answers into handwritten-style notes.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                Generate clean notebook-style revision notes from your
                AI answers and study them like your own handwritten
                notes.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold">
                <span className="rounded-full bg-white/15 px-4 py-2">
                  RANKER BHAIYA
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2">
                  ASK VIDHYA
                </span>

                <span className="rounded-full bg-white/15 px-4 py-2">
                  EXAM READY
                </span>
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <div className="relative rotate-[-4deg] rounded-2xl bg-[#fffdf4] p-5 text-slate-800 shadow-2xl">
                <div className="absolute -left-3 top-6 space-y-5">
                  {Array.from({ length: 6 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-3 w-3 rounded-full border border-slate-500 bg-slate-200"
                      />
                    ),
                  )}
                </div>

                <div className="w-64">
                  <div className="text-xs font-black text-indigo-700">
                    RANKER BHAIYA
                  </div>

                  <div className="mt-1 text-[10px] font-bold text-slate-400">
                    ASK VIDHYA
                  </div>

                  <div className="mt-5 text-2xl font-black">
                    Smart Revision
                  </div>

                  <div className="mt-4 space-y-2 text-sm leading-7">
                    <div className="border-b border-blue-200">
                      Important concept
                    </div>

                    <div className="border-b border-blue-200">
                      Key facts
                    </div>

                    <div className="border-b border-blue-200">
                      Exam point
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="no-print mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon="📒"
            title="Notebook Style"
            description="Ruled-paper handwritten presentation."
          />

          <Feature
            icon="🧠"
            title="AI Powered"
            description="Use answers generated by Ask Vidhya."
          />

          <Feature
            icon="🎯"
            title="Exam Focused"
            description="Important points are highlighted."
          />

          <Feature
            icon="🖨️"
            title="Print / PDF"
            description="Print the notes or save them as PDF."
          />
        </section>

        {/* Generator */}
        <section className="no-print mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Note Generator
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Create your handwritten notes
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Ask Vidhya ka answer yahan automatically aa sakta
              hai, ya tum apna content manually paste kar sakte ho.
            </p>
          </div>

          <form
            onSubmit={handleGenerate}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-bold">
                Topic
              </label>

              <input
                type="text"
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                placeholder="e.g. Indian Polity"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                AI Answer / Notes Content
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={10}
                placeholder="Paste your Ask Vidhya answer here..."
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold">
                Handwriting Style
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {NOTE_STYLES.map((style) => {
                  const active =
                    selectedStyle === style.id;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setSelectedStyle(style.id)
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40"
                          : "border-slate-200 bg-slate-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-950"
                      }`}
                    >
                      <div
                        className="text-lg font-bold"
                        style={{
                          fontFamily: style.font,
                        }}
                      >
                        Aa Notes
                      </div>

                      <div className="mt-2 text-sm font-black">
                        {style.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {style.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition hover:scale-[1.01] hover:shadow-xl"
              >
                ✍️ Generate Handwritten Notes
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-slate-200 px-6 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Preview controls */}
        <section className="no-print mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Preview
            </div>

            <h2 className="mt-1 text-2xl font-black">
              Your Notebook
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {pages.length} page
              {pages.length === 1 ? "" : "s"} • Page{" "}
              {currentPage + 1} of {pages.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadText}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              📄 Download Text
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              🖨️ Print / Save PDF
            </button>
          </div>
        </section>

        {/* Notebook */}
        <section className="print-area mt-6">
          {generated && pages[currentPage] ? (
            <div className="notebook-print-page">
              <NotebookPage
                page={pages[currentPage]}
                topic={topic}
                font={activeStyle.font}
                darkMode={darkMode}
              />
            </div>
          ) : (
            <div className="no-print rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <div className="text-5xl">📒</div>

              <h3 className="mt-4 text-xl font-black">
                Your notes will appear here
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Ask Vidhya se answer generate karo aur
                handwritten-style revision notes create karo.
              </p>
            </div>
          )}
        </section>

        {/* Pagination */}
        {pages.length > 1 && (
          <section className="no-print mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(0, page - 1),
                )
              }
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
            >
              ← Previous
            </button>

            <div className="rounded-xl bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {currentPage + 1} / {pages.length}
            </div>

            <button
              type="button"
              disabled={
                currentPage === pages.length - 1
              }
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    pages.length - 1,
                    page + 1,
                  ),
                )
              }
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
            >
              Next →
            </button>
          </section>
        )}

        {/* Bottom info */}
        <section className="no-print mt-10 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="text-3xl">💡</div>

            <div>
              <h3 className="font-black text-indigo-900 dark:text-indigo-200">
                Smart Revision Tip
              </h3>

              <p className="mt-2 text-sm leading-7 text-indigo-800/80 dark:text-indigo-300/80">
                Handwritten-style notes ko short revision ke liye
                use karo. Important points ko mark karke exam se
                pehle quick revision karna aur bhi easy ho jayega.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="no-print mt-12 border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-xs font-semibold text-slate-400 sm:flex-row sm:px-6 lg:px-8 sm:text-left">
          <div>
            © {new Date().getFullYear()} RANKER BHAIYA
          </div>

          <div>
            Powered by Ask Vidhya • Smart Learning • Smart Revision
          </div>
        </div>
      </footer>
    </div>
  );
}
