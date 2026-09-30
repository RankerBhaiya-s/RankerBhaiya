import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ContactUs() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mailSubject =
      subject.trim() || "Contact Request - Ranker Bhaiya";

    const mailBody = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      "",
      "Message:",
      message.trim(),
    ].join("\n");

    const mailtoUrl =
      `mailto:help.theharbyco@gmail.com` +
      `?subject=${encodeURIComponent(mailSubject)}` +
      `&body=${encodeURIComponent(mailBody)}`;

    window.location.href = mailtoUrl;

    setSubmitted(true);
  };

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
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-indigo-100">
            Get In Touch
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Contact Us
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-indigo-50 sm:text-base">
            Have a question, suggestion, feedback or need help with Ranker
            Bhaiya? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Contact Information */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Contact Information
            </p>

            <h2 className="mt-3 text-3xl font-black">
              We are here to help
            </h2>

            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Whether you have feedback about the platform, need assistance
              with your account or want to share an idea, feel free to contact
              us.
            </p>

            <div className="mt-8 space-y-5">
              {/* Email */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Email
                </p>

                <a
                  href="mailto:help.theharbyco@gmail.com"
                  className="mt-2 block break-all font-black text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  help.theharbyco@gmail.com
                </a>
              </div>

              {/* Platform */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Platform
                </p>

                <p className="mt-2 font-black">
                  Ranker Bhaiya
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Student-focused learning and exam preparation platform.
                </p>
              </div>

              {/* Response */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
                <p className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Support
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                  Please include enough details in your message so that our
                  team can understand and respond to your request properly.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                Send a Message
              </p>

              <h2 className="mt-3 text-3xl font-black">
                How can we help?
              </h2>
            </div>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-xl font-black text-white">
                  ✓
                </div>

                <h3 className="mt-4 text-xl font-black">
                  Message ready
                </h3>

                <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">
                  Your email application should open with the message details.
                  If it does not open automatically, please email us directly
                  at{" "}
                  <a
                    href="mailto:help.theharbyco@gmail.com"
                    className="font-black text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    help.theharbyco@gmail.com
                  </a>
                  .
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-black"
                  >
                    Name
                  </label>

                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-sm font-black"
                  >
                    Email
                  </label>

                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-2 block text-sm font-black"
                  >
                    Subject
                  </label>

                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(event) =>
                      setSubject(event.target.value)
                    }
                    placeholder="What is this about?"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-black"
                  >
                    Message
                  </label>

                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    placeholder="Write your message..."
                    required
                    rows={6}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700"
                >
                  Send Message
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Bottom Links */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Want to know more about Ranker Bhaiya?
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/about"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              About Us
            </Link>

            <Link
              to="/privacy-policy"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} Ranker Bhaiya. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link
              to="/about"
              className="hover:text-indigo-600"
            >
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
