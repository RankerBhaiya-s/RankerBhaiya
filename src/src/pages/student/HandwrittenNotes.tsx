import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

/* =========================================================
   TYPES
========================================================= */

type NoteStyle = "blue" | "purple" | "green";

interface NoteSection {
  heading: string;
  content: string[];
  points?: string[];
}

interface NotePage {
  pageNumber: number;
  title: string;
  sections: NoteSection[];
}

/* =========================================================
   DEFAULT DEMO CONTENT
========================================================= */

const defaultPages: NotePage[] = [
  {
    pageNumber: 1,
    title: "Photosynthesis",
    sections: [
      {
        heading: "What is Photosynthesis?",
        content: [
          "Photosynthesis is the process by which green plants prepare their own food using sunlight, carbon dioxide and water.",
          "This process mainly takes place in the green parts of plants because they contain chlorophyll.",
        ],
        points: [
          "Occurs mainly in green leaves",
          "Sunlight provides energy",
          "Chlorophyll absorbs light energy",
        ],
      },
      {
        heading: "Main Raw Materials",
        content: [],
        points: [
          "Carbon dioxide (CO₂)",
          "Water (H₂O)",
          "Sunlight",
          "Chlorophyll",
        ],
      },
      {
        heading: "Exam Point",
        content: [
          "The food produced during photosynthesis is mainly glucose, which can later be stored as starch.",
        ],
      },
    ],
  },
  {
    pageNumber: 2,
    title: "Process of Photosynthesis",
    sections: [
      {
        heading: "How does it happen?",
        content: [
          "Roots absorb water from the soil. Carbon dioxide enters the leaves through tiny pores called stomata.",
          "Chlorophyll captures sunlight and provides the energy needed for the reaction.",
        ],
        points: [
          "Roots → absorb water",
          "Stomata → allow CO₂ to enter",
          "Chlorophyll → captures sunlight",
          "Leaves → prepare food",
        ],
      },
      {
        heading: "Chemical Equation",
        content: [
          "Carbon dioxide + Water → Glucose + Oxygen",
          "The reaction takes place in the presence of sunlight and chlorophyll.",
        ],
      },
      {
        heading: "Remember",
        content: [
          "Photosynthesis converts light energy into chemical energy stored in food.",
        ],
      },
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

function createPagesFromText(
  topic: string,
  rawContent: string,
): NotePage[] {
  const cleanTopic = topic.trim() || "My Study Notes";

  const paragraphs = rawContent
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return defaultPages.map((page) => ({
      ...page,
      title:
        page.pageNumber === 1
          ? cleanTopic
          : page.title,
    }));
  }

  const chunkSize = 4;
  const chunks: string[][] = [];

  for (let i = 0; i < paragraphs.length; i += chunkSize) {
    chunks.push(paragraphs.slice(i, i + chunkSize));
  }

  return chunks.map((chunk, index) => ({
    pageNumber: index + 1,
    title:
      index === 0
        ? cleanTopic
        : `${cleanTopic} — Part ${index + 1}`,
    sections: [
      {
        heading:
          index === 0
            ? "Quick Understanding"
            : "Important Points",
        content: chunk,
        points:
          chunk.length > 2
            ? chunk.slice(0, Math.min(3, chunk.length))
            : undefined,
      },
    ],
  }));
}

/* =========================================================
   NOTEBOOK PAPER
========================================================= */

function NotebookPage({
  page,
  style,
}: {
  page: NotePage;
  style: NoteStyle;
}) {
  const accentClass = {
    blue: "text-blue-700",
    purple: "text-violet-700",
    green: "text-emerald-700",
  }[style];

  const badgeClass = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple:
      "bg-violet-100 text-violet-700 border-violet-200",
    green:
      "bg-emerald-100 text-emerald-700 border-emerald-200",
  }[style];

  return (
    <div
      className="
        relative
        min-h-[780px]
        overflow-hidden
        rounded-[4px]
        border border-slate-200
        bg-[#fffdf7]
        shadow-2xl
        dark:border-slate-700
        dark:bg-[#fffdf7]
      "
    >
      {/* Red margin */}
      <div
        className="
          absolute
          left-[64px]
          top-0
          bottom-0
          z-10
          w-px
          bg-red-300/70
        "
      />

      {/* Notebook lines */}
      <div
        className="
          absolute
          inset-0
          opacity-70
          pointer-events-none
          bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,#bfdbfe_32px)]
        "
      />

      {/* Spiral holes */}
      <div className="absolute left-3 top-0 bottom-0 z-20 flex flex-col justify-evenly">
        {Array.from({ length: 18 }).map((_, index) => (
          <div
            key={index}
            className="
              h-3.5
              w-3.5
              rounded-full
              border-2
              border-slate-400
              bg-slate-200
              shadow-inner
            "
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 px-20 pb-16 pt-12">
        {/* Branding */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[10px] font-black tracking-[0.28em] text-slate-400">
              RANKER BHAIYA
            </div>

            <div className="text-[11px] font-bold tracking-widest text-violet-500">
              ASK VIDHYA • HANDWRITTEN NOTES
            </div>
          </div>

          <div
            className={`
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-full
              border-2
              bg-white
              font-black
              ${badgeClass}
            `}
          >
            R
          </div>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <div
            className={`
              mb-2 inline-block
              rounded-full
              border
              px-3 py-1
              text-[10px]
              font-black
              uppercase
              tracking-wider
              ${badgeClass}
            `}
          >
            Page {page.pageNumber}
          </div>

          <h2
            className={`
              text-4xl
              font-black
              leading-tight
              ${accentClass}
              [font-family:cursive]
            `}
          >
            {page.title}
          </h2>

          <div className="mt-2 h-1 w-32 rounded-full bg-violet-300" />
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {page.sections.map((section, index) => (
            <section key={`${section.heading}-${index}`}>
              <h3
                className="
                  mb-3
                  inline-block
                  text-2xl
                  font-bold
                  text-slate-800
                  [font-family:cursive]
                "
              >
                {section.heading}
              </h3>

              <div className="space-y-3">
                {section.content.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="
                      max-w-3xl
                      text-[18px]
                      leading-[1.85]
                      text-slate-700
                      [font-family:cursive]
                    "
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.points?.length ? (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border-2
                    border-dashed
                    border-blue-300
                    bg-blue-50/70
                    px-5
                    py-4
                  "
                >
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-blue-600">
                    Important Points
                  </div>

                  <ul className="space-y-2">
                    {section.points.map((point, pointIndex) => (
                      <li
                        key={pointIndex}
                        className="
                          flex
                          gap-3
                          text-[17px]
                          leading-7
                          text-slate-700
                          [font-family:cursive]
                        "
                      >
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-5 left-20 right-10 flex items-center justify-between border-t border-slate-300/70 pt-3">
          <span className="text-[10px] font-black tracking-widest text-slate-400">
            ASK VIDHYA
          </span>

          <span className="text-[10px] font-bold text-slate-400">
            RANKER BHAIYA
          </span>

          <span className="text-[10px] font-bold text-slate-400">
            {page.pageNumber}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL UI HELPERS
========================================================= */

function Feature({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
        {children}
      </p>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function HandwrittenNotes() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [topic, setTopic] = useState("Photosynthesis");

  const [content, setContent] = useState(
    `Photosynthesis is the process by which green plants prepare their own food using sunlight, carbon dioxide and water.
This process mainly takes place in the green parts of plants because they contain chlorophyll.
Roots absorb water from the soil while carbon dioxide enters the leaves through tiny pores called stomata.
Chlorophyll captures sunlight and provides the energy needed for photosynthesis.
The food produced is mainly glucose, which can later be stored as starch.
Photosynthesis also releases oxygen into the atmosphere.`,
  );

  const [style, setStyle] = useState<NoteStyle>("blue");

  const [pages, setPages] =
    useState<NotePage[]>(defaultPages);

  const [currentPage, setCurrentPage] = useState(0);

  const [generated, setGenerated] = useState(true);

  const totalPages = pages.length;

  const current = pages[currentPage];

  const progress = useMemo(() => {
    if (!totalPages) return 0;

    return Math.round(
      ((currentPage + 1) / totalPages) * 100,
    );
  }, [currentPage, totalPages]);

  /* =======================================================
     GENERATE
  ======================================================= */

  function handleGenerate(event: FormEvent) {
    event.preventDefault();

    const nextPages = createPagesFromText(
      topic,
      content,
    );

    setPages(nextPages);
    setCurrentPage(0);
    setGenerated(true);
  }

  /* =======================================================
     PRINT / PDF
  ======================================================= */

  function handlePrint() {
    window.print();
  }

  /* =======================================================
     DOWNLOAD TEXT
  ======================================================= */

  function handleDownloadText() {
    const text = pages
      .map((page) => {
        const sections = page.sections
          .map((section) => {
            const contentText =
              section.content.join("\n");

            const pointsText =
              section.points?.length
                ? `\n${section.points
                    .map((point) => `• ${point}`)
                    .join("\n")}`
                : "";

            return `${section.heading}\n\n${contentText}${pointsText}`;
          })
          .join("\n\n");

        return `PAGE ${page.pageNumber}\n${page.title}\n\n${sections}`;
      })
      .join("\n\n============================\n\n");

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${topic || "ranker-bhaiya-notes"}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  /* =======================================================
     RESET
  ======================================================= */

  function handleReset() {
    setTopic("Photosynthesis");

    setContent(
      `Photosynthesis is the process by which green plants prepare their own food using sunlight, carbon dioxide and water.
This process mainly takes place in the green parts of plants because they contain chlorophyll.
Roots absorb water from the soil while carbon dioxide enters the leaves through tiny pores called stomata.
Chlorophyll captures sunlight and provides the energy needed for photosynthesis.
The food produced is mainly glucose, which can later be stored as starch.
Photosynthesis also releases oxygen into the atmosphere.`,
    );

    setPages(defaultPages);
    setCurrentPage(0);
    setStyle("blue");
    setGenerated(true);
  }

  return (
    <div
      className={`
        min-h-screen
        ${
          theme === "dark"
            ? "bg-slate-950"
            : "bg-slate-50"
        }
      `}
    >
      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-black text-white shadow-lg">
              R
            </div>

            <div className="text-left">
              <div className="text-sm font-black tracking-wide text-slate-900 dark:text-white">
                RANKER BHAIYA
              </div>

              <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
                Learning Platform
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/student/ask")
            }
            className="
              rounded-xl
              border
              border-violet-200
              bg-violet-50
              px-4
              py-2
              text-sm
              font-bold
              text-violet-700
              transition
              hover:bg-violet-100
              dark:border-violet-900
              dark:bg-violet-950/40
              dark:text-violet-300
            "
          >
            ← Ask Vidhya
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Hero */}
        <section className="mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
                ✍️ ASK VIDHYA • HANDWRITTEN NOTES
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Learn it.
                <br />
                <span className="text-violet-200">
                  Write it.
                </span>
                <br />
                Remember it.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Convert your study content into beautiful
                notebook-style handwritten notes powered by
                the Ranker Bhaiya learning experience.
              </p>
            </div>

            <div className="shrink-0">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                  Powered by
                </div>

                <div className="mt-2 text-xl font-black">
                  RANKER BHAIYA
                </div>

                <div className="mt-1 text-sm font-semibold text-violet-200">
                  Ask Vidhya
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            FEATURES
        =================================================== */}

        <div className="mb-8 grid gap-4 md:grid-cols-3 print:hidden">
          <Feature icon="📓" title="Notebook Style">
            Clean ruled-paper layout with handwritten-style
            typography.
          </Feature>

          <Feature icon="🧠" title="Exam Focused">
            Important points and quick-revision sections are
            clearly highlighted.
          </Feature>

          <Feature icon="⚡" title="Local Renderer">
            The visual notebook rendering happens directly
            inside the browser.
          </Feature>
        </div>

        {/* ===================================================
            GENERATOR
        =================================================== */}

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Create Handwritten Notes
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Enter your topic and study content. The local
              renderer will convert it into notebook pages.
            </p>
          </div>

          <form
            onSubmit={handleGenerate}
            className="space-y-5"
          >
            {/* Topic */}
            <div>
              <label
                htmlFor="notes-topic"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Topic
              </label>

              <input
                id="notes-topic"
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                placeholder="e.g. Photosynthesis"
                className="
                  w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  outline-none
                  transition
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              />
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="notes-content"
                className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
              >
                Study Content
              </label>

              <textarea
                id="notes-content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={8}
                placeholder="Paste your study content here..."
                className="
                  w-full
                  resize-y
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-4
                  text-sm
                  leading-7
                  outline-none
                  transition
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              />
            </div>

            {/* Style */}
            <div>
              <div className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                Notebook Style
              </div>

              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ["blue", "🔵 Classic Blue"],
                    ["purple", "🟣 Purple Study"],
                    ["green", "🟢 Green Notes"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStyle(value)
                    }
                    className={`
                      rounded-xl
                      border
                      px-4
                      py-2.5
                      text-sm
                      font-bold
                      transition
                      ${
                        style === value
                          ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm dark:bg-violet-950/40 dark:text-violet-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="
                  rounded-2xl
                  bg-gradient-to-r
                  from-violet-600
                  to-blue-600
                  px-6
                  py-3
                  text-sm
                  font-black
                  text-white
                  shadow-lg
                  shadow-violet-500/20
                  transition
                  hover:-translate-y-0.5
                "
              >
                ✨ Generate Notes
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-slate-300
                "
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* ===================================================
            PREVIEW HEADER
        =================================================== */}

        {generated && current ? (
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-500">
                  Handwritten Preview
                </div>

                <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                  {topic || "My Study Notes"}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadText}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  ↓ Text
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                  🖨 Print / PDF
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-5 print:hidden">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>
                  Page {currentPage + 1} of {totalPages}
                </span>

                <span>{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>

            {/* Notebook */}
            <div className="mx-auto max-w-4xl">
              <NotebookPage
                page={current}
                style={style}
              />
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between print:hidden">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(0, page - 1),
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-200
                "
              >
                ← Previous
              </button>

              <div className="flex max-w-[50%] gap-2 overflow-x-auto px-2">
                {pages.map((page, index) => (
                  <button
                    key={page.pageNumber}
                    type="button"
                    onClick={() =>
                      setCurrentPage(index)
                    }
                    className={`
                      h-9
                      min-w-9
                      rounded-lg
                      px-2
                      text-xs
                      font-black
                      transition
                      ${
                        currentPage === index
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    {page.pageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={
                  currentPage === totalPages - 1
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages - 1,
                        page + 1,
                      ),
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-bold
                  text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-200
                "
              >
                Next →
              </button>
            </div>
          </section>
        ) : null}
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800 print:hidden">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="text-sm font-black tracking-wider text-slate-700 dark:text-slate-200">
            RANKER BHAIYA
          </div>

          <div className="mt-1 text-xs font-semibold text-violet-500">
            Ask Vidhya • Handwritten Notes
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Aapki Mehnat, Hamari Strategy.
          </p>
        </div>
      </footer>
    </div>
  );
}
