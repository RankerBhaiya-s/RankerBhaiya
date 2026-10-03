import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="px-8 py-3">
          <div className="text-xl font-black text-blue-600">
            RANKER BHAIYA
          </div>

          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
            Aapki Mehnat, Hamari Strategy.
          </p>
        </div>

        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Ranker Bhaiya Admin
              </h1>

              <p className="text-xs text-slate-500">
                Administration Dashboard
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="px-8 py-6">

        {/* =====================================================
            WELCOME
        ===================================================== */}

        <section className="rounded-2xl bg-slate-900 p-6 text-white">
          <p className="text-xs text-blue-200">
            Welcome Admin
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Harsh
          </h2>

          <p className="mt-2 text-xs text-slate-400">
            You have administrator access to Ranker Bhaiya.
          </p>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* STUDENTS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">
              Students
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              —
            </p>
          </div>

          {/* NCERT */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">
              NCERT Books
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              —
            </p>
          </div>

          {/* CURRENT AFFAIRS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">
              Current Affairs
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              —
            </p>
          </div>

          {/* AI */}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">
              AI
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              ON
            </p>
          </div>

        </section>

        {/* =====================================================
            MANAGEMENT
        ===================================================== */}

        <h2 className="mt-7 text-lg font-bold text-slate-900">
          Management
        </h2>

        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* =================================================
              SYLLABUS
          ================================================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-3xl">
              📚
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Syllabus
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Upload and update class-wise and government exam syllabus using CSV.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/syllabus")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Syllabus
            </button>

          </div>

          {/* =================================================
              NCERT BOOKS
          ================================================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-3xl">
              📖
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              NCERT Books
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Upload and manage complete NCERT books as PDF files.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/ncert")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Manage NCERT Books
            </button>

          </div>

          {/* =================================================
              CURRENT AFFAIRS
          ================================================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-3xl">
              📰
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Current Affairs
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Upload weekly current affairs and exam-focused news using CSV.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/current-affairs")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Current Affairs
            </button>

          </div>

          {/* =================================================
              NEWSPAPER
          ================================================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-3xl">
              🗞️
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Newspaper
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Upload newspaper PDFs, translate them, and generate current
              affairs and MCQs using AI.
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin/newspaper")}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Newspaper
            </button>

          </div>

          {/* =================================================
              STUDENTS
          ================================================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-3xl">
              🧑‍🎓
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Students
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage student accounts and profiles.
            </p>

            <button
              type="button"
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Manage
            </button>

          </div>

          {/* =================================================
              AI SETTINGS
          ================================================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">

            <div className="text-3xl">
              🤖
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              AI Settings
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Configure Ranker Bhaiya AI learning features.
            </p>

            <button
              type="button"
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Configure
            </button>

          </div>

        </section>

      </main>
    </div>
  );
}

export default AdminDashboard;
