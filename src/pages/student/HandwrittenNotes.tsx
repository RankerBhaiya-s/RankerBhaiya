import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";

interface HandwrittenNotesLocationState {
  topic?: string;
  content?: string;
  source?: string;
}

interface StructuredNotes {
  title: string;
  introduction: string;
  keyConcepts: string[];
  importantFacts: string[];
  examPoint: string;
  quickRevision: string[];
  memoryTrick: string;
}

interface NotePage {
  pageNumber: number;
  notes: StructuredNotes;
}

interface NoteStyle {
  id: string;
  name: string;
  font: string;
  description: string;
}

const NOTE_STYLES: NoteStyle[] = [
  {
    id: "classic",
    name: "Classic Handwritten",
    font: '"Segoe Print", "Comic Sans MS", cursive',
    description: "Clean classroom-notes look",
  },
  {
    id: "exam",
    name: "Exam Revision",
    font: '"Bradley Hand", "Segoe Print", cursive',
    description: "Compact competitive-exam style",
  },
  {
    id: "study",
    name: "Study Notes",
    font: '"Comic Sans MS", "Segoe Print", cursive',
    description: "Natural handwritten appearance",
  },
];

const DEMO_TOPIC = "Photosynthesis";

const DEMO_CONTENT = `Photosynthesis is the process by which green plants prepare their own food using sunlight, carbon dioxide and water.

This process mainly takes place in the green parts of plants because they contain chlorophyll.

Roots absorb water from the soil while carbon dioxide enters the leaves through tiny pores called stomata.

Chlorophyll captures sunlight and provides the energy needed for photosynthesis.

The food produced is mainly glucose, which can later be stored as starch.

Photosynthesis also releases oxygen into the atmosphere.

The process is important because it provides food for plants and releases oxygen required by living organisms.`;

function cleanText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function splitSentences(value: string): string[] {
  return value
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeShortPoint(value: string, maxLength = 145) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/^[-•*]\s*/, "")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength).trim()}…`;
}

function removeDuplicatePoints(points: string[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = point.toLowerCase().replace(/\W/g, "");

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getTopicKeywords(topic: string) {
  return topic
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, "").toLowerCase())
    .filter((word) => word.length > 3);
}

function buildStructuredNotes(
  topicInput: string,
  contentInput: string,
): StructuredNotes {
  const topic = topicInput.trim() || "Study Notes";
  const content = cleanText(contentInput);

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const sentences = splitSentences(content);

  const usableSentences =
    sentences.length > 0
      ? sentences
      : paragraphs.flatMap(splitSentences);

  const intro =
    paragraphs[0] ||
    usableSentences[0] ||
    `Key study notes on ${topic}.`;

  const remaining = usableSentences.slice(1);

  const keyConcepts = removeDuplicatePoints(
    remaining
      .slice(0, 5)
      .map((item) => makeShortPoint(item)),
  );

  const importantFacts = removeDuplicatePoints(
    [
      ...remaining.slice(5, 10),
      ...paragraphs.slice(1, 4),
    ].map((item) => makeShortPoint(item)),
  ).slice(0, 6);

  const allFacts = removeDuplicatePoints(
    usableSentences.map((item) => makeShortPoint(item)),
  );

  const quickRevisionSource =
    allFacts.length > 0
      ? allFacts.slice(0, 5)
      : [makeShortPoint(content)];

  const keywords = getTopicKeywords(topic);

  const keywordText =
    keywords.length > 0
      ? keywords.slice(0, 3).join(", ")
      : "the main concepts";

  const examPoint =
    importantFacts[0] ||
    keyConcepts[0] ||
    `Focus on the main concepts, facts and keywords related to ${topic}.`;

  const memoryTrick =
    keyConcepts.length >= 2
      ? `${topic}: remember the core idea first, then connect it with ${keywordText}.`
      : `Revise ${topic} using the highlighted facts and one-line revision points.`;

  return {
    title: topic,
    introduction: makeShortPoint(intro, 240),
    keyConcepts:
      keyConcepts.length > 0
        ? keyConcepts
        : [makeShortPoint(content, 150)],
    importantFacts:
      importantFacts.length > 0
        ? importantFacts
        : allFacts.slice(0, 5),
    examPoint: makeShortPoint(examPoint, 220),
    quickRevision: quickRevisionSource,
    memoryTrick: makeShortPoint(memoryTrick, 220),
  };
}

function createPages(
  topic: string,
  content: string,
): NotePage[] {
  const structured = buildStructuredNotes(
    topic,
    content,
  );

  const pageOne: StructuredNotes = {
    ...structured,
    importantFacts: structured.importantFacts.slice(
      0,
      3,
    ),
    quickRevision: structured.quickRevision.slice(
      0,
      3,
    ),
  };

  const pageTwoNeeded =
    structured.importantFacts.length > 3 ||
    structured.quickRevision.length > 3;

  const pages: NotePage[] = [
    {
      pageNumber: 1,
      notes: pageOne,
    },
  ];

  if (pageTwoNeeded) {
    pages.push({
      pageNumber: 2,
      notes: {
        ...structured,
        introduction: structured.examPoint,
        keyConcepts: structured.keyConcepts.slice(0, 5),
        importantFacts:
          structured.importantFacts.slice(3, 6),
        quickRevision:
          structured.quickRevision.slice(3, 6),
      },
    });
  }

  return pages;
}

function SectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 text-xs font-black text-indigo-700">
        {number}
      </div>

      <h2 className="text-[19px] font-black uppercase tracking-wide text-indigo-800">
        {title}
      </h2>
    </div>
  );
}

function BulletList({
  items,
  marker = "•",
}: {
  items: string[];
  marker?: string;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-3 text-[15px] font-semibold leading-7 text-slate-700"
        >
          <span className="mt-0.5 shrink-0 font-black text-indigo-600">
            {marker}
          </span>

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NotebookPage({
  page,
  font,
  darkMode,
}: {
  page: NotePage;
  font: string;
  darkMode: boolean;
}) {
  const { notes } = page;

  return (
    <div
      className={`relative mx-auto min-h-[820px] w-full max-w-[850px] overflow-hidden rounded-[4px] border shadow-2xl ${
        darkMode
          ? "border-slate-700"
          : "border-slate-300"
      }`}
      style={{
        fontFamily: font,
        backgroundColor: "#fffdf5",
      }}
    >
      {/* Ruled paper */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 34px, rgba(70,130,200,0.18) 35px)",
          backgroundPosition: "0 48px",
        }}
      />

      {/* Red margin */}
      <div className="pointer-events-none absolute bottom-0 left-[74px] top-0 w-[2px] bg-red-300/80" />

      {/* Spiral */}
      <div className="absolute bottom-0 left-0 top-0 z-20 flex w-[30px] flex-col items-center justify-around py-8">
        {Array.from({ length: 17 }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-4 rounded-full border-2 border-slate-500 bg-slate-200 shadow-inner"
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 pb-10 pl-[98px] pt-10 sm:pr-12">
        {/* Branding */}
        <div className="mb-7 flex items-start justify-between gap-4 border-b-2 border-indigo-200 pb-4">
          <div>
            <div className="text-[18px] font-black tracking-[0.08em] text-indigo-700">
              RANKER BHAIYA
            </div>

            <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Ask Vidhya • Handwritten Revision Notes
            </div>
          </div>

          <div className="rounded-lg border-2 border-indigo-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600">
            Exam Notes
          </div>
        </div>

        {/* Topic */}
        <div className="mb-7">
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Topic
          </div>

          <h1 className="text-[29px] font-black leading-tight text-slate-900">
            {notes.title}
          </h1>
        </div>

        {/* 01 Introduction */}
        <section className="mb-7">
          <SectionTitle
            number="01"
            title="Introduction"
          />

          <p className="pl-11 text-[16px] font-semibold leading-8 text-slate-700">
            {notes.introduction}
          </p>
        </section>

        {/* 02 Key Concepts */}
        <section className="mb-7">
          <SectionTitle
            number="02"
            title="Key Concepts"
          />

          <div className="pl-11">
            <BulletList items={notes.keyConcepts} />
          </div>
        </section>

        {/* 03 Important Facts */}
        {notes.importantFacts.length > 0 && (
          <section className="mb-7">
            <SectionTitle
              number="03"
              title="Important Facts"
            />

            <div className="rounded-xl border-2 border-amber-300 bg-amber-50/80 p-4 pl-5">
              <BulletList
                items={notes.importantFacts}
                marker="★"
              />
            </div>
          </section>
        )}

        {/* 04 Exam Point */}
        <section className="mb-7">
          <SectionTitle
            number="04"
            title="Exam Point"
          />

          <div className="rounded-xl border-2 border-indigo-400 bg-indigo-50/90 p-5">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-indigo-700">
              🎯 Remember for the exam
            </div>

            <p className="text-[15px] font-bold leading-7 text-slate-700">
              {notes.examPoint}
            </p>
          </div>
        </section>

        {/* 05 Quick Revision */}
        <section className="mb-7">
          <SectionTitle
            number="05"
            title="Quick Revision"
          />

          <div className="pl-11">
            <BulletList
              items={notes.quickRevision}
              marker="→"
            />
          </div>
        </section>

        {/* 06 Memory Trick */}
        <section className="mb-7">
          <SectionTitle
            number="06"
            title="Memory Trick"
          />

          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/80 p-4">
            <p className="text-[15px] font-bold leading-7 text-slate-700">
              🧠 {notes.memoryTrick}
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t-2 border-slate-300 pt-4 text-[10px] font-black uppercase tracking-wider text-slate-400">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

  const incomingTopic =
    noteState?.topic?.trim() || "";

  const incomingContent =
    noteState?.content?.trim() || "";

  const [topic, setTopic] = useState(
    incomingTopic || DEMO_TOPIC,
  );

  const [content, setContent] = useState(
    incomingContent || DEMO_CONTENT,
  );

  const [selectedStyle, setSelectedStyle] =
    useState("exam");

  const [pages, setPages] = useState<NotePage[]>(() =>
    createPages(
      incomingTopic || DEMO_TOPIC,
      incomingContent || DEMO_CONTENT,
    ),
  );

  const [currentPage, setCurrentPage] = useState(0);

  const [generated, setGenerated] = useState(
    Boolean(incomingContent),
  );

  useEffect(() => {
    if (!incomingTopic && !incomingContent) {
      return;
    }

    const nextTopic =
      incomingTopic || "AI Generated Notes";

    const nextContent =
      incomingContent || DEMO_CONTENT;

    setTopic(nextTopic);
    setContent(nextContent);

    setPages(
      createPages(nextTopic, nextContent),
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

    setPages(
      createPages(
        cleanTopic,
        cleanContent,
      ),
    );

    setTopic(cleanTopic);
    setContent(cleanContent);
    setCurrentPage(0);
    setGenerated(true);
  };

  const handleReset = () => {
    setTopic(DEMO_TOPIC);
    setContent(DEMO_CONTENT);

    setPages(
      createPages(
        DEMO_TOPIC,
        DEMO_CONTENT,
      ),
    );

    setCurrentPage(0);
    setGenerated(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const structured = buildStructuredNotes(
      topic,
      content,
    );

    const text = [
      "RANKER BHAIYA",
      "ASK VIDHYA — HANDWRITTEN REVISION NOTES",
      "",
      `TOPIC: ${structured.title}`,
      "",
      "01. INTRODUCTION",
      structured.introduction,
      "",
      "02. KEY CONCEPTS",
      ...structured.keyConcepts.map(
        (item) => `• ${item}`,
      ),
      "",
      "03. IMPORTANT FACTS",
      ...structured.importantFacts.map(
        (item) => `★ ${item}`,
      ),
      "",
      "04. EXAM POINT",
      structured.examPoint,
      "",
      "05. QUICK REVISION",
      ...structured.quickRevision.map(
        (item) => `→ ${item}`,
      ),
      "",
      "06. MEMORY TRICK",
      structured.memoryTrick,
      "",
      "Generated by Ranker Bhaiya • Ask Vidhya",
    ].join("\n");

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download =
      `${topic
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase()
        .replace(/^-+|-+$/g, "") ||
        "ranker-bhaiya-notes"}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
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

      {/* HEADER */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              navigate("/student/ask")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg">
              R
            </div>

            <div className="text-left">
              <div className="font-black tracking-wide">
                RANKER BHAIYA
              </div>

              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ask Vidhya • Handwritten Notes
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/student/ask")
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700"
          >
            ← Ask Vidhya
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="no-print overflow-hidden rounded-[30px] bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-7 text-white shadow-2xl sm:p-9 lg:p-11">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider">
              ✍️ AI Handwritten Revision Notes
            </div>

            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Convert Ask Vidhya answers into exam-ready handwritten notes.
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-indigo-100 sm:text-base">
              Structured for competitive-exam preparation with
              key concepts, important facts, exam points,
              quick revision and memory tricks.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs font-black">
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
        </section>

        {/* FEATURES */}
        <section className="no-print mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon="📌"
            title="Structured Notes"
            description="Proper exam-oriented hierarchy instead of casual paragraphs."
          />

          <Feature
            icon="⭐"
            title="Important Facts"
            description="Key facts are separated for faster revision."
          />

          <Feature
            icon="🎯"
            title="Exam Point"
            description="A dedicated section for examination relevance."
          />

          <Feature
            icon="🧠"
            title="Memory Trick"
            description="Quick memory support for last-minute revision."
          />
        </section>

        {/* GENERATOR */}
        <section className="no-print mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Note Generator
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Create exam-ready handwritten notes
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Ask Vidhya ka answer automatically receive hoga,
              ya tum manually content paste kar sakte ho.
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
                value={topic}
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                placeholder="e.g. Fundamental Rights"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Ask Vidhya Answer
              </label>

              <textarea
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                rows={11}
                placeholder="Paste your Ask Vidhya answer here..."
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
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
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
                      }`}
                    >
                      <div
                        className="text-xl font-bold"
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
                className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:scale-[1.01]"
              >
                ✍️ Generate Exam Notes
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-2xl border border-slate-200 px-6 py-4 text-sm font-bold dark:border-slate-700"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* PREVIEW HEADER */}
        <section className="no-print mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Preview
            </div>

            <h2 className="mt-1 text-2xl font-black">
              Handwritten Exam Notes
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Page {currentPage + 1} of {pages.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadText}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              📄 Download Text
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
            >
              🖨️ Print / Save PDF
            </button>
          </div>
        </section>

        {/* NOTEBOOK */}
        <section className="print-area mt-6">
          {generated && pages[currentPage] ? (
            <div className="notebook-print-page">
              <NotebookPage
                page={pages[currentPage]}
                font={activeStyle.font}
                darkMode={darkMode}
              />
            </div>
          ) : (
            <div className="no-print rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <div className="text-5xl">📒</div>

              <h3 className="mt-4 text-xl font-black">
                Your exam notes will appear here
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Ask Vidhya se answer generate karo aur
                structured handwritten revision notes banao.
              </p>
            </div>
          )}
        </section>

        {/* PAGINATION */}
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
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
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
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold disabled:opacity-40 dark:border-slate-700"
            >
              Next →
            </button>
          </section>
        )}

        {/* INFO */}
        <section className="no-print mt-10 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <div className="flex gap-4">
            <div className="text-3xl">🎯</div>

            <div>
              <h3 className="font-black text-indigo-900 dark:text-indigo-200">
                Built for competitive-exam revision
              </h3>

              <p className="mt-2 text-sm leading-7 text-indigo-800/80 dark:text-indigo-300/80">
                Notes ko intentionally short, structured aur
                revision-friendly rakha gaya hai, taaki long AI
                answers ko quickly revise kiya ja sake.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="no-print mt-12 border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center text-xs font-semibold text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} RANKER BHAIYA
          </span>

          <span>
            ASK VIDHYA • SMART LEARNING • SMART REVISION
          </span>
        </div>
      </footer>
    </div>
  );
}
