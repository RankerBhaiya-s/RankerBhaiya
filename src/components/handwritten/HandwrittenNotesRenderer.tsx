import type {
  HandwrittenNoteSection,
  HandwrittenNotesData,
  NoteFlowStep,
} from "../../types/handwrittenNotes";

interface Props {
  notes: HandwrittenNotesData;
}

/* =====================================================
   FLOW BOX
===================================================== */

function FlowBox({
  step,
}: {
  step: NoteFlowStep;
}) {
  const colorClass =
    step.color === "yellow"
      ? "hw-flow-yellow"
      : step.color === "green"
        ? "hw-flow-green"
        : step.color === "pink"
          ? "hw-flow-pink"
          : "hw-flow-blue";

  return (
    <div className={`hw-flow-box ${colorClass}`}>
      <div className="hw-flow-title">
        {step.title}
      </div>

      {step.hindi && (
        <div className="hw-flow-hindi">
          {step.hindi}
        </div>
      )}

      {step.description && (
        <div className="hw-flow-description">
          {step.description}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   PLANT CELL DIAGRAM
===================================================== */

function PlantCellDiagram() {
  return (
    <div className="hw-plant-diagram">
      <div className="hw-plant-title">
        Plant Cell
      </div>

      <div className="hw-plant-cell">
        <div className="hw-cell-nucleus">
          <span />
        </div>

        <div className="hw-chloroplast hw-c1" />
        <div className="hw-chloroplast hw-c2" />
        <div className="hw-chloroplast hw-c3" />
        <div className="hw-chloroplast hw-c4" />

        <div className="hw-cell-label hw-label-wall">
          Cell Wall
        </div>

        <div className="hw-cell-label hw-label-nucleus">
          Nucleus
        </div>

        <div className="hw-cell-label hw-label-chloro">
          Chloroplasts
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   CHLOROPLAST DIAGRAM
===================================================== */

function ChloroplastDiagram() {
  return (
    <div className="hw-chloroplast-diagram">
      <div className="hw-chloro-title">
        Chloroplast
      </div>

      <div className="hw-chloro-body">
        <div className="hw-thylakoid-stack">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="hw-thylakoid-stack second">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="hw-stroma-label">
          Stroma
        </div>
      </div>

      <div className="hw-chloro-label">
        Thylakoids
      </div>
    </div>
  );
}

/* =====================================================
   GENERIC DIAGRAM
===================================================== */

function GenericDiagram({
  title,
  labels = [],
}: {
  title: string;
  labels?: string[];
}) {
  return (
    <div className="hw-generic-diagram">
      <div className="hw-generic-title">
        {title}
      </div>

      <div className="hw-generic-visual">
        <div className="hw-generic-circle">
          ✦
        </div>

        <div className="hw-generic-arrows">
          <span>→</span>
          <span>→</span>
        </div>
      </div>

      {labels.length > 0 && (
        <div className="hw-generic-labels">
          {labels.map(
            (label, index) => (
              <span
                key={`${label}-${index}`}
              >
                {label}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   DIAGRAM
===================================================== */

function Diagram({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.diagram) {
    return null;
  }

  if (
    section.diagram.type ===
    "plant-cell"
  ) {
    return <PlantCellDiagram />;
  }

  if (
    section.diagram.type ===
    "chloroplast"
  ) {
    return <ChloroplastDiagram />;
  }

  return (
    <GenericDiagram
      title={section.diagram.title}
      labels={section.diagram.labels}
    />
  );
}

/* =====================================================
   BULLET LIST
===================================================== */

function BulletList({
  points,
}: {
  points: NonNullable<
    HandwrittenNoteSection["points"]
  >;
}) {
  return (
    <div className="hw-bullet-list">
      {points.map(
        (point, index) => (
          <div
            className="hw-bullet"
            key={`${point.title ?? "point"}-${index}`}
          >
            <span className="hw-bullet-mark">
              •
            </span>

            <div className="hw-bullet-content">
              <div className="hw-point-text">
                {point.title && (
                  <strong>
                    {point.title}:{" "}
                  </strong>
                )}

                {point.text}
              </div>

              {point.hindi && (
                <div className="hw-hindi-line">
                  {point.hindi}
                </div>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

/* =====================================================
   SECTION
===================================================== */

function Section({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  return (
    <section className="hw-section">
      {/* HEADING */}

      <div className="hw-section-heading">
        <span className="hw-heading-bullet">
          ●
        </span>

        <span className="hw-heading-text">
          {section.heading}

          {section.headingHindi && (
            <>
              {" "}
              /{" "}
              <span className="hw-hindi">
                {section.headingHindi}
              </span>
            </>
          )}
        </span>
      </div>

      {/* DEFINITIONS */}

      {section.type ===
        "definitions" &&
        section.points && (
          <div className="hw-definition-list">
            {section.points.map(
              (point, index) => (
                <div
                  className="hw-definition"
                  key={`${point.title ?? "definition"}-${index}`}
                >
                  <span className="hw-dot">
                    •
                  </span>

                  <div>
                    <div className="hw-point-text">
                      {point.title && (
                        <strong>
                          {point.title}:{" "}
                        </strong>
                      )}

                      {point.text}
                    </div>

                    {point.hindi && (
                      <div className="hw-hindi-line">
                        {point.hindi}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

      {/* BULLETS */}

      {section.type ===
        "bullets" &&
        section.points && (
          <BulletList
            points={section.points}
          />
        )}

      {/* DIAGRAM */}

      {section.type === "diagram" && (
        <Diagram section={section} />
      )}

      {/* FLOWCHART */}

      {section.type ===
        "flowchart" &&
        section.flow && (
          <div className="hw-flow">
            {section.flow.map(
              (step, index) => (
                <div
                  className="hw-flow-item"
                  key={`${step.title}-${index}`}
                >
                  <FlowBox step={step} />

                  {index <
                    section.flow!.length -
                      1 && (
                    <div className="hw-flow-arrow">
                      →
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}

      {/* EQUATION */}

      {section.type ===
        "equation" &&
        section.equation && (
          <div className="hw-equation-box">
            <div className="hw-equation-heading">
              {section.equation.label ??
                "Chemical Equation"}
            </div>

            <div className="hw-equation">
              {
                section.equation
                  .equation
              }
            </div>
          </div>
        )}

      {/* EXAM POINTS */}

      {section.type ===
        "exam_points" &&
        section.items && (
          <div className="hw-exam-box">
            <div className="hw-exam-heading">
              ⭐ Important Points
            </div>

            <div className="hw-exam-list">
              {section.items.map(
                (item, index) => (
                  <div
                    className="hw-exam-item"
                    key={`${item}-${index}`}
                  >
                    <span className="hw-check">
                      ✓
                    </span>

                    <span>
                      {item}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {/* QUICK REVISION */}

      {section.type ===
        "quick_revision" &&
        section.items && (
          <div className="hw-revision-box">
            <div className="hw-revision-heading">
              ⚡ Quick Revision
              <span>
                / झटपट याद रखें
              </span>
            </div>

            <div className="hw-revision-list">
              {section.items.map(
                (item, index) => (
                  <div
                    className="hw-revision-item"
                    key={`${item}-${index}`}
                  >
                    <span className="hw-check">
                      ✓
                    </span>

                    <span>
                      {item}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {/* MEMORY TRICK */}

      {section.type ===
        "mnemonic" &&
        section.mnemonic && (
          <div className="hw-mnemonic">
            <div className="hw-mnemonic-label">
              🧠 Memory Trick
            </div>

            <div className="hw-mnemonic-text">
              {section.mnemonic}
            </div>
          </div>
        )}
    </section>
  );
}

/* =====================================================
   PAGE BRANDING
===================================================== */

function PageBranding() {
  return (
    <header className="hw-brand-header">
      <div className="hw-ranker-brand">
        <div className="hw-brand-icon">
          🎓
        </div>

        <div>
          <div className="hw-brand-name">
            RANKER BHAIYA
          </div>

          <div className="hw-brand-tagline">
            Aapki Mehnat, Hamari Strategy.
          </div>
        </div>
      </div>

      <div className="hw-vidhya-brand">
        <div className="hw-vidhya-icon">
          ✍️
        </div>

        <div>
          <div className="hw-vidhya-name">
            ASK VIDHYA
          </div>

          <div className="hw-vidhya-tagline">
            Your Learning Assistant
          </div>
        </div>
      </div>
    </header>
  );
}

/* =====================================================
   TITLE
===================================================== */

function NoteTitle({
  notes,
}: {
  notes: HandwrittenNotesData;
}) {
  return (
    <div className="hw-title-area">
      <h1>
        {notes.title}

        {notes.titleHindi && (
          <>
            {" "}
            /{" "}
            <span className="hw-hindi">
              {notes.titleHindi}
            </span>
          </>
        )}
      </h1>

      {notes.titleRoman && (
        <div className="hw-title-roman">
          {notes.titleRoman}
        </div>
      )}

      {notes.subtitle && (
        <div className="hw-subtitle">
          {notes.subtitle}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   FOOTER
===================================================== */

function PageFooter({
  footerTip,
}: {
  footerTip?: string;
}) {
  return (
    <>
      {footerTip && (
        <div className="hw-footer-tip">
          💡 {footerTip}
        </div>
      )}

      <footer className="hw-footer">
        <span>
          RANKER BHAIYA
        </span>

        <span>•</span>

        <span>
          Ask Vidhya
        </span>

        <span>•</span>

        <span>
          Smart Study Notes
        </span>
      </footer>
    </>
  );
}

/* =====================================================
   MAIN RENDERER
===================================================== */

export default function HandwrittenNotesRenderer({
  notes,
}: Props) {
  return (
    <div className="hw-renderer-wrapper">
      <article className="hw-page">
        <PageBranding />

        <NoteTitle notes={notes} />

        <main className="hw-content">
          {notes.sections.map(
            (section) => (
              <Section
                key={section.id}
                section={section}
              />
            ),
          )}
        </main>

        <PageFooter
          footerTip={notes.footerTip}
        />
      </article>
    </div>
  );
}
