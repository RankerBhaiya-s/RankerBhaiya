import { Link, useNavigate } from "react-router-dom";

export default function AboutUs() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400"
          >
            Ranker Bhaiya
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ← Back
            </button>

            <Link
              to="/"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-100">
            About Ranker Bhaiya
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl lg:text-6xl">
            Learn Smarter. Prepare Better.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-indigo-50 sm:text-lg">
            Ranker Bhaiya is a student-focused learning platform built to make
            exam preparation simpler, smarter, and more effective.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Who We Are */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Who We Are
            </p>

            <h2 className="mt-3 text-3xl font-black">
              A learning platform built for students
            </h2>

            <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">
              Ranker Bhaiya is designed to bring important learning resources,
              exam preparation tools, current affairs, revision support,
              vocabulary building, and AI-powered learning assistance together
              in one place.
            </p>

            <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
              Our goal is to reduce the complexity of preparation and help
              students build a consistent learning routine with the right
              resources at the right time.
            </p>
          </section>

          {/* What We Provide */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                What We Provide
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Everything you need to prepare smarter
              </h2>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Daily Current Affairs",
                  description:
                    "Stay updated with important national, international and exam-relevant current affairs.",
                },
                {
                  title: "Daily Newspaper",
                  description:
                    "Read important newspaper updates and stay connected with what is happening around you.",
                },
                {
                  title: "Fast Revision",
                  description:
                    "Revise important concepts quickly and make your preparation more efficient.",
                },
                {
                  title: "Vocabulary Building",
                  description:
                    "Improve English vocabulary through useful words, meanings, examples and practice.",
                },
                {
                  title: "Ask Vidhya",
                  description:
                    "Use AI-powered learning assistance to understand concepts and clear study doubts.",
                },
                {
                  title: "Practice & Challenges",
                  description:
                    "Practice questions, daily challenges and other activities to stay consistent.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950"
                >
                  <h3 className="text-lg font-black">{item.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission */}
          <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-sm sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-200">
                Our Mission
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Making preparation simpler and more effective
              </h2>

              <p className="mt-5 leading-8 text-indigo-50">
                Our mission is to help students learn with clarity, stay
                consistent and prepare with confidence. We believe that
                effective preparation is not only about studying more, but
                about studying smarter.
              </p>
            </div>
          </section>

          {/* Founders */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                The Team Behind Ranker Bhaiya
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Meet Our Founders
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
                Ranker Bhaiya is built with a vision to make learning more
                accessible, structured and effective for students.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {/* Harsh Singh */}
              <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950">
                <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 p-1 shadow-lg ring-4 ring-indigo-100 dark:ring-indigo-950">
                  <img
                    src={`${baseUrl}founders/harsh-singh.jpg`}
                    alt="Mr. Harsh Singh"
                    className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <h3 className="mt-5 text-xl font-black">
                  Mr. Harsh Singh
                </h3>

                <p className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  M.B.A
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                  Founder
                </p>
              </div>

              {/* Bankatesh Kumar */}
              <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950">
                <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-pink-600 p-1 shadow-lg ring-4 ring-purple-100 dark:ring-purple-950">
                  <img
                    src={`${baseUrl}founders/bankatesh-kumar.jpg`}
                    alt="Mr. Bankatesh Kumar"
                    className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <h3 className="mt-5 text-xl font-black">
                  Mr. Bankatesh Kumar
                </h3>

                <p className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  M.B.A
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                  Co-Founder
                </p>
              </div>

              {/* Abhishek Kumar */}
              <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950">
                <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-pink-600 to-rose-600 p-1 shadow-lg ring-4 ring-pink-100 dark:ring-pink-950">
                  <img
                    src={`${baseUrl}founders/abhishek-kumar.jpg`}
                    alt="Mr. Abhishek Kumar"
                    className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                <h3 className="mt-5 text-xl font-black">
                  Mr. Abhishek Kumar
                </h3>

                <p className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  B.C.A
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                  Co-Founder
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-8 text-center dark:border-indigo-900 dark:bg-indigo-950/40">
            <h2 className="text-2xl font-black">
              Ready to learn smarter?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
              Explore Ranker Bhaiya and make your preparation more structured,
              focused and consistent.
            </p>

            <Link
              to="/student/dashboard"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Ranker Bhaiya. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link
              to="/contact"
              className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Contact Us
            </Link>

            <Link
              to="/privacy-policy"
              className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
