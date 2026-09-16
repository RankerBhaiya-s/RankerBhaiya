import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export function StudentProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [board, setBoard] = useState("");
  const [exam, setExam] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setClassName(profile.class_name ?? "");
      setBoard(profile.board ?? "");
      setExam(profile.exam ?? "");
    }
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!user) {
      setError("You must be logged in to update your profile.");
      return;
    }

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (!className) {
      setError("Please select your class.");
      return;
    }

    if (!board) {
      setError("Please select your board.");
      return;
    }

    if (!exam) {
      setError("Please select your exam.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          class_name: className,
          board,
          exam,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();

      setSuccess("Profile saved successfully! 🎉");

      setTimeout(() => {
        navigate("/student/dashboard");
      }, 700);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save profile.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white sm:py-10">
      <div className="mx-auto w-full max-w-2xl">

        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>

          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            Student Profile
          </span>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-xl">
            RB
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            My Profile
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Keep your study information updated for a personalized
            Ranker Bhaiya experience.
          </p>
        </div>

        {/* Profile Card */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Card Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 dark:border-slate-800 dark:from-blue-950/30 dark:to-indigo-950/30 sm:px-8">
            <h2 className="text-lg font-black">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tell us a little about your preparation.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Your email is linked to your account and cannot be
                  changed here.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                />
              </div>

              {/* Class */}
              <div>
                <label
                  htmlFor="className"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Class
                </label>

                <select
                  id="className"
                  value={className}
                  onChange={(event) =>
                    setClassName(event.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                >
                  <option value="">Select your class</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              {/* Board */}
              <div>
                <label
                  htmlFor="board"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Board
                </label>

                <select
                  id="board"
                  value={board}
                  onChange={(event) =>
                    setBoard(event.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                >
                  <option value="">Select your board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Exam */}
              <div>
                <label
                  htmlFor="exam"
                  className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                  Exam
                </label>

                <select
                  id="exam"
                  value={exam}
                  onChange={(event) =>
                    setExam(event.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500"
                >
                  <option value="">Select your exam</option>
                  <option value="School Exams">
                    School Exams
                  </option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="CUET">CUET</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
              >
                ⚠️ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
              >
                {success}
              </div>
            )}

            {/* Save */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving Profile..." : "Save Profile"}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Ranker Bhaiya • Aapki Mehnat, Hamari Strategy
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
