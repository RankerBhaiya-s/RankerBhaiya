import { useState } from "react";
import { Link } from "react-router-dom";

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const subject = String(formData.get("subject") ?? "");
    const message = String(formData.get("message") ?? "");

    const mailSubject = encodeURIComponent(
      subject || "Ranker Bhaiya Contact Request",
    );

    const mailBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    );

    window.location.href =
      `mailto:help.theharbyco@gmail.com?subject=${mailSubject}&body=${mailBody}`;

    setSubmitted(true);
  };

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
            Get In Touch
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Contact Us
          </h1>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-indigo-50">
            Have a question, suggestion, feedback, or need help with Ranker
            Bhaiya? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-2xl font-black">
              We'd Love to Hear From You
            </h2>

            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Whether you have feedback about the platform, found an issue,
              want to suggest a feature, or need assistance, feel free to
              contact us.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="text-2xl">📧</div>

                <h3 className="mt-2 font-black">
                  Email
                </h3>

                <a
                  href="mailto:help.theharbyco@gmail.com"
                  className="mt-1 block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  help.theharbyco@gmail.com
                </a>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="text-2xl">💬</div>

                <h3 className="mt-2 font-black">
                  Support
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  For account, learning content, or technical support, please
                  send us a detailed message.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="text-2xl">⏱️</div>

                <h3 className="mt-2 font-black">
                  Response Time
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  We aim to respond to support requests as soon as reasonably
                  possible.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-2xl font-black">
              Send Us a Message
            </h2>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="text-3xl">📧</div>

                <h3 className="mt-3 text-lg font-black">
                  Your email client should open shortly.
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  If it did not open automatically, email us directly at
                  help.theharbyco@gmail.com.
                </p>

                <a
                  href="mailto:help.theharbyco@gmail.com"
                  className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  Email Us
                </a>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-bold"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-bold"
                  >
                    Message
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder="Write your message..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-black text-white transition hover:bg-indigo-700"
                >
                  Send Message
                </button>
              </form>
            )}
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
            <Link to="/about" className="hover:text-indigo-600">
              About Us
            </Link>

            <Link
              to="/privacy-policy"
              className="hover:text-indigo-600"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
