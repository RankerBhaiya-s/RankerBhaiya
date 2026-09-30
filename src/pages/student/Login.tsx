import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";

export function StudentLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function redirectStudent(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, class_name, board, exam")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw profileError;
    }

    const profileComplete =
      Boolean(profile?.full_name?.trim()) &&
      Boolean(profile?.class_name) &&
      Boolean(profile?.board) &&
      Boolean(profile?.exam);

    if (profileComplete) {
      navigate("/student/dashboard", { replace: true });
    } else {
      navigate("/student/profile", { replace: true });
    }
  }

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (loginError) {
      throw loginError;
    }

    if (!data.user) {
      throw new Error("Login failed. Please try again.");
    }

    await redirectStudent(data.user.id);
  }

  async function handleSignup() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

    if (signupError) {
      throw signupError;
    }

    if (!data.user) {
      throw new Error(
        "Unable to create account. Please try again.",
      );
    }

    if (!data.session) {
      setMessage(
        "Account created successfully. Please check your email and confirm your account before logging in. / अकाउंट बन गया है। कृपया अपना ईमेल चेक करके अकाउंट कन्फर्म करें।",
      );
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: cleanName,
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error(
        "Profile name update error:",
        profileError,
      );
    }

    await redirectStudent(data.user.id);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError(
        "Please enter email and password. / कृपया ईमेल और पासवर्ड दर्ज करें।",
      );
      return;
    }

    if (isSignup && !fullName.trim()) {
      setError(
        "Please enter your full name. / कृपया अपना पूरा नाम दर्ज करें।",
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters. / पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
      );
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        await handleSignup();
      } else {
        await handleLogin();
      }
    } catch (err) {
      console.error("Student authentication error:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      if (
        errorMessage
          .toLowerCase()
          .includes("invalid login credentials")
      ) {
        setError(
          "Invalid email or password. / ईमेल या पासवर्ड गलत है।",
        );
      } else if (
        errorMessage
          .toLowerCase()
          .includes("email not confirmed")
      ) {
        setError(
          "Please confirm your email before logging in. / लॉगिन करने से पहले अपना ईमेल कन्फर्म करें।",
        );
      } else if (
        errorMessage
          .toLowerCase()
          .includes("user already registered")
      ) {
        setError(
          "This email is already registered. Please login instead. / यह ईमेल पहले से रजिस्टर है। लॉगिन करें।",
        );
      } else if (
        errorMessage
          .toLowerCase()
          .includes("invalid path specified in request url")
      ) {
        setError(
          "Supabase configuration error. Please check VITE_SUPABASE_URL in GitHub Secrets.",
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    if (loading) {
      return;
    }

    setIsSignup((previous) => !previous);
    setError("");
    setMessage("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-turmeric/5 blur-3xl" />

      {/* =====================================================
          LOGIN WRAPPER
      ===================================================== */}

      <div className="relative w-full max-w-md">
        {/* Top branding */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-600/20">
            R
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
            Ranker Bhaiya
          </p>
        </div>

        {/* =====================================================
            CARD
        ===================================================== */}

        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/30">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="p-6 sm:p-8">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-black text-white shadow-xl shadow-blue-600/25">
                R
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {isSignup
                  ? t("studentLogin.createAccount")
                  : t("studentLogin.login")}
              </h1>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
                {isSignup
                  ? t("studentLogin.createSubtitle")
                  : t("studentLogin.loginSubtitle")}
              </p>
            </div>

            {/* =================================================
                MODE INDICATOR
            ================================================= */}

            <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!loading) {
                    setIsSignup(false);
                    setError("");
                    setMessage("");
                  }
                }}
                disabled={loading}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${
                  !isSignup
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!loading) {
                    setIsSignup(true);
                    setError("");
                    setMessage("");
                  }
                }}
                disabled={loading}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${
                  isSignup
                    ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* FULL NAME */}
              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    {t("studentLogin.fullName")}
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      👤
                    </span>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder={t(
                        "studentLogin.fullNamePlaceholder",
                      )}
                      disabled={loading}
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t("studentLogin.email")}
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    ✉️
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="student@example.com"
                    disabled={loading}
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    {t("studentLogin.password")}
                  </label>

                  <span className="text-xs font-medium text-slate-400">
                    Min. 6 characters
                  </span>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    🔒
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder={t(
                      "studentLogin.passwordPlaceholder",
                    )}
                    disabled={loading}
                    autoComplete={
                      isSignup
                        ? "new-password"
                        : "current-password"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous,
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  <span className="shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* MESSAGE */}
              {message && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <span className="shrink-0">✓</span>
                  <span>{message}</span>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>
                      Please wait... / कृपया प्रतीक्षा करें...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {isSignup
                        ? t(
                            "studentLogin.createAccountButton",
                          )
                        : t(
                            "studentLogin.loginButton",
                          )}
                    </span>

                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                BOTTOM INFO
            ================================================= */}

            <div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                {isSignup
                  ? t("studentLogin.alreadyAccount")
                  : t("studentLogin.noAccount")}

                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="ml-1 font-bold text-blue-600 transition hover:text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-blue-400 dark:hover:text-indigo-400"
                >
                  {isSignup
                    ? t("studentLogin.login")
                    : t("studentLogin.createAccount")}
                </button>
              </div>
            </div>

            {/* Security note */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span>🔐</span>
              <span>Secure student authentication</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Ranker Bhaiya
        </p>
      </div>
    </div>
  );
}

export default StudentLogin;
