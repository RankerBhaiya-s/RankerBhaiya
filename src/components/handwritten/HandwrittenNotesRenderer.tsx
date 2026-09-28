import type {
  HandwrittenNoteSection,
  HandwrittenNotesData,
  NoteFlowStep,
} from "../../types/handwrittenNotes";

interface Props {
  notes: HandwrittenNotesData;
}

/* =========================================================
   FLOW BOX
========================================================= */

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

/* =========================================================
   PLANT CELL DIAGRAM
========================================================= */

function PlantCellDiagram() {
  return (
    <div className="hw-plant-diagram">
      <div className="hw-plant-title">
        Plant Cell / पादप कोशिका
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
          <br />
          <span className="hw-hindi">
            कोशिका भित्ति
          </span>
        </div>

        <div className="hw-cell-label hw-label-nucleus">
          Nucleus
          <br />
          <span className="hw-hindi">
            केन्द्रक
          </span>
        </div>

        <div className="hw-cell-label hw-label-chloro">
          Chloroplasts
          <br />
          <span className="hw-hindi">
            हरितलवक
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CHLOROPLAST DIAGRAM
========================================================= */

function ChloroplastDiagram() {
  return (
    <div className="hw-chloroplast-diagram">
      <div className="hw-chloro-title">
        Chloroplast / हरितलवक
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
          <br />
          <span className="hw-hindi">
            स्ट्रोमा
          </span>
        </div>
      </div>

      <div className="hw-chloro-label">
        Thylakoids / थायलाकोइड
      </div>
    </div>
  );
}

/* =========================================================
   GENERIC DIAGRAM
========================================================= */

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

        <div className="hw-generic-circle">
          ✓
        </div>
      </div>

      {labels.length > 0 && (
        <div className="hw-generic-labels">
          {labels.map((label, index) => (
            <span
              key={`${label}-${index}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DIAGRAM ROUTER
========================================================= */

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

/* =========================================================
   DEFINITIONS
========================================================= */

function DefinitionSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.points?.length) {
    return null;
  }

  return (
    <div className="hw-definition-list">
      {section.points.map(
        (point, index) => (
          <div
            className="hw-definition"
            key={`${section.id}-definition-${index}`}
          >
            <span className="hw-dot">
              ●
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
  );
}

/* =========================================================
   BULLETS
========================================================= */

function BulletSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.points?.length) {
    return null;
  }

  return (
    <div className="hw-bullet-list">
      {section.points.map(
        (point, index) => (
          <div
            className="hw-bullet"
            key={`${section.id}-bullet-${index}`}
          >
            <span>•</span>

            <div>
              <div>
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

/* =========================================================
   FLOWCHART
========================================================= */

function FlowchartSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.flow?.length) {
    return null;
  }

  return (
    <div className="hw-flow">
      {section.flow.map(
        (step, index) => (
          <div
            className="hw-flow-item"
            key={`${section.id}-flow-${index}`}
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
  );
}

/* =========================================================
   EQUATION
========================================================= */

function EquationSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.equation) {
    return null;
  }

  return (
    <div className="hw-equation-box">
      <div className="hw-equation-heading">
        {section.equation.label ??
          "Chemical Equation / रासायनिक समीकरण"}
      </div>

      <div className="hw-equation">
        {section.equation.equation}
      </div>
    </div>
  );
}

/* =========================================================
   EXAM POINTS
========================================================= */

function ExamPointsSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.items?.length) {
    return null;
  }

  return (
    <div className="hw-exam-box">
      <div className="hw-exam-heading">
        ⭐ Important Points for Exams
      </div>

      {section.items.map(
        (item, index) => (
          <div
            className="hw-exam-item"
            key={`${section.id}-exam-${index}`}
          >
            <span>✓</span>

            <span>{item}</span>
          </div>
        ),
      )}
    </div>
  );
}

/* =========================================================
   QUICK REVISION
========================================================= */

function QuickRevisionSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.items?.length) {
    return null;
  }

  return (
    <div className="hw-revision-box">
      <div className="hw-revision-heading">
        💡 Quick Revision / झटपट याद रखें
      </div>

      {section.items.map(
        (item, index) => (
          <div
            className="hw-revision-item"
            key={`${section.id}-revision-${index}`}
          >
            <span>✓</span>

            <span>{item}</span>
          </div>
        ),
      )}
    </div>
  );
}

/* =========================================================
   MEMORY TRICK
========================================================= */

function MnemonicSection({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.mnemonic) {
    return null;
  }

  return (
    <div className="hw-mnemonic">
      <div className="hw-mnemonic-label">
        🧠 Memory Trick
      </div>

      <div>
        {section.mnemonic}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  return (
    <section
      className="hw-section"
      data-section-id={section.id}
    >
      {/* Section heading */}

      <div className="hw-section-heading">
        <span className="hw-section-number">
          {section.id}
        </span>

        <span>
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

      {/* Definitions */}

      {section.type ===
        "definitions" && (
        <DefinitionSection
          section={section}
        />
      )}

      {/* Bullets */}

      {section.type ===
        "bullets" && (
        <BulletSection
          section={section}
        />
      )}

      {/* Diagram */}

      {section.type ===
        "diagram" && (
        <Diagram section={section} />
      )}

      {/* Flowchart */}

      {section.type ===
        "flowchart" && (
        <FlowchartSection
          section={section}
        />
      )}

      {/* Equation */}

      {section.type ===
        "equation" && (
        <EquationSection
          section={section}
        />
      )}

      {/* Exam Points */}

      {section.type ===
        "exam_points" && (
        <ExamPointsSection
          section={section}
        />
      )}

      {/* Quick Revision */}

      {section.type ===
        "quick_revision" && (
        <QuickRevisionSection
          section={section}
        />
      )}

      {/* Memory Trick */}

      {section.type ===
        "mnemonic" && (
        <MnemonicSection
          section={section}
        />
      )}
    </section>
  );
}

/* =========================================================
   MAIN RENDERER
========================================================= */

export default function HandwrittenNotesRenderer({
  notes,
}: Props) {
  const sections =
    Array.isArray(notes.sections)
      ? notes.sections
      : [];

  return (
    <div className="hw-renderer-wrapper">
      <div className="hw-page">

        {/* =================================================
            BRAND HEADER
        ================================================= */}

        <header className="hw-brand-header">
          {/* Ranker Bhaiya */}

          <div className="hw-ranker-brand">
            <div className="hw-brand-icon">
              🎓
            </div>

            <div>
              <div className="hw-brand-name">
                RANKER BHAIYA
              </div>

              <div className="hw-brand-tagline">
                Better Students → Brighter Future
              </div>
            </div>
          </div>

          {/* Ask Vidhya */}

          <div className="hw-vidhya-brand">
            <div className="hw-vidhya-icon">
              ✍️
            </div>

            <div>
              <div className="hw-vidhya-name">
                Ask Vidhya
              </div>

              <div className="hw-vidhya-tagline">
                Your AI Learning Assistant
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            TITLE
        ================================================= */}

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
              ({notes.titleRoman})
            </div>
          )}

          {notes.subtitle && (
            <div className="hw-subtitle">
              {notes.subtitle}
            </div>
          )}
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="hw-content">
          {sections.map(
            (section) => (
              <Section
                key={section.id}
                section={section}
              />
            ),
          )}
        </main>

        {/* =================================================
            FOOTER TIP
        ================================================= */}

        {notes.footerTip && (
          <div className="hw-footer-tip">
            💡 {notes.footerTip}
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="hw-footer">
          <span>
            ✍️ Ask Vidhya
          </span>

          <span>•</span>

          <strong>
            RANKER BHAIYA
          </strong>

          <span>♥</span>
        </footer>
      </div>
    </div>
  );
}
