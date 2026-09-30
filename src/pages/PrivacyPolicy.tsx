import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400"
          >
            Ranker Bhaiya
          </Link>

          <Link
            to="/"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-100">
            Your Privacy Matters
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-5 text-sm text-indigo-100">
            Last updated: September 2026
          </p>
        </div>
      </section>

      {/* Policy */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-black">
                1. Introduction
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Welcome to Ranker Bhaiya. We respect your privacy and are
                committed to protecting the information you provide while using
                our learning platform.
              </p>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                This Privacy Policy explains what information may be collected,
                how it may be used, and how we work to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                2. Information We Collect
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Depending on how you use Ranker Bhaiya, we may collect
                information such as:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-600 dark:text-slate-300">
                <li>Name and email address.</li>
                <li>Student profile information provided by you.</li>
                <li>
                  Learning and activity information generated while using the
                  platform.
                </li>
                <li>
                  Information you voluntarily provide when contacting us.
                </li>
                <li>
                  Technical information required to operate and secure the
                  platform.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                3. How We Use Information
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Information may be used to:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-slate-600 dark:text-slate-300">
                <li>Create and manage your account.</li>
                <li>
                  Provide learning resources and platform features.
                </li>
                <li>Track learning activity and progress.</li>
                <li>
                  Improve the functionality and user experience of Ranker
                  Bhaiya.
                </li>
                <li>Provide support and respond to your requests.</li>
                <li>
                  Maintain platform security and prevent misuse.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                4. Account Information
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                If you create an account, you are responsible for keeping your
                login credentials secure. Please contact us if you believe that
                your account has been accessed without authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                5. Learning Activity
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Ranker Bhaiya may store information about activities performed
                on the platform, such as practice questions, revisions,
                current affairs, challenges, vocabulary, newspaper reading,
                short videos, and Ask Vidhya interactions.
              </p>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                This information may be used to provide progress tracking,
                streaks, achievements, and personalized learning experiences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                6. Ask Vidhya
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Ask Vidhya is an AI-powered learning feature. Information
                submitted through the feature may be processed to generate
                educational responses and learning content.
              </p>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Users should avoid submitting passwords, payment information,
                government identification numbers, or other highly sensitive
                personal information into AI prompts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                7. Cookies and Local Storage
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Ranker Bhaiya may use browser storage and similar technologies
                to remember preferences such as theme or language settings and
                to provide a better experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                8. Third-Party Services
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Ranker Bhaiya may use third-party services to provide
                authentication, database, storage, analytics, AI, hosting, or
                other technical functionality.
              </p>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Such services may process information according to their own
                privacy policies and applicable terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                9. Data Security
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                We take reasonable measures to protect information from
                unauthorized access, alteration, disclosure, or destruction.
                However, no internet-based service can guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                10. Children's Privacy
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                Ranker Bhaiya is an educational platform. If a parent or
                guardian believes that a child has provided personal information
                inappropriately, they may contact us so that the matter can be
                reviewed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                11. Your Choices
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                You may contact us regarding questions about your account or
                personal information associated with your use of Ranker Bhaiya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black">
                12. Changes to This Policy
              </h2>

              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
                We may update this Privacy Policy from time to time. Any
                changes will be reflected on this page along with an updated
                revision date.
              </p>
            </section>

            {/* Contact */}
            <section className="rounded-2xl bg-indigo-50 p-6 dark:bg-indigo-950/40">
              <h2 className="text-2xl font-black">
                13. Contact Us
              </h2>

              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                If you have questions about this Privacy Policy or how your
                information is handled, please contact us at:
              </p>

              <a
                href="mailto:help.theharbyco@gmail.com"
                className="mt-4 inline-block font-black text-indigo-600 hover:underline dark:text-indigo-400"
              >
                help.theharbyco@gmail.com
              </a>

              <div>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
                >
                  Contact Ranker Bhaiya
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Ranker Bhaiya. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link to="/about" className="hover:text-indigo-600">
              About Us
            </Link>

            <Link to="/contact" className="hover:text-indigo-600">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
