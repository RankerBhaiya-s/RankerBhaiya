import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import { Logo } from "../../components/Logo";

type RecoveryMode = "none" | "choose" | "link" | "otp" | "new-password";

export function StudentLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>("none");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode("new-password");
          setError("");
          setMessage("Set your new password.");
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function redirectStudent(userId: string) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, class_name, board, exam")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    const complete =
      Boolean(profile?.full_name?.trim()) &&
      Boolean(profile?.class_name) &&
      Boolean(profile?.board) &&
      Boolean(profile?.exam);

    navigate(complete ? "/student/dashboard" : "/student/profile", {
      replace: true,
    });
  }

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login failed. Please try again.");

    await redirectStudent(data.user.id);
  }

  async function handleSignup() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error("Unable to create account.");

    if (!data.session) {
      setMessage(
        "Account created. Check your email and confirm your account before logging in.",
      );
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: cleanName })
      .eq("id", data.user.id);

    if (profileError) console.error(profileError);

    await redirectStudent(data.user.id);
  }

  async function sendResetLink() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Enter your email address.");

    const redirectTo = `${window.location.origin}${window.location.pathname}#/student/login`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      { redirectTo },
    );

    if (error) throw error;

    setMessage("If an account exists for this email, a reset email will be sent.");
  }

  async function sendResetOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Enter your email address.");

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

    if (error) throw error;

    setRecoveryMode("otp");
    setMessage("Check your email for the password reset code.");
  }

  async function verifyResetOtp() {
    const cleanEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp.trim())) {
      throw new Error("Enter the 6-digit code from your email.");
    }

    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: otp.trim(),
      type: "recovery",
    });

    if (error) throw error;

    setRecoveryMode("new-password");
    setMessage("Code verified. Set your new password.");
  }

  async function updatePassword() {
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    await supabase.auth.signOut();
    setPassword("");
    setNewPassword("");
    setOtp("");
    setRecoveryMode("none");
    setMessage("Password updated. You can now log in.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (recoveryMode === "link") {
        await sendResetLink();
      } else if (recoveryMode === "otp") {
        await verifyResetOtp();
      } else if (recoveryMode === "new-password") {
        await updatePassword();
      } else {
        if (!email.trim()) throw new Error("Enter your email address.");
        if (!password) throw new Error("Enter your password.");

        if (isSignup) {
          if (!fullName.trim()) throw new Error("Enter your full name.");
          if (password.length < 6) {
            throw new Error("Password must be at least 6 characters.");
          }
          await handleSignup();
        } else {
          await handleLogin();
        }
      }
    } catch (err) {
      console.error("Student authentication error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetRecovery() {
    setRecoveryMode("none");
    setOtp("");
    setNewPassword("");
    setError("");
    setMessage("");
  }

  const recoveryTitle =
    recoveryMode === "link"
      ? "Reset password by email link"
      : recoveryMode === "otp"
        ? "Verify reset code"
        : recoveryMode === "new-password"
          ? "Set a new password"
          : "Forgot password";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex flex-col items-center text-center">
          <Logo withWordmark={false} className="mb-3 text-blue-700 dark:text-blue-300" />
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
            Ranker Bhaiya
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="p-6 sm:p-8">
            <div className="mb-7 text-center">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {recoveryMode === "none"
                  ? isSignup
                    ? t("studentLogin.createAccount")
                    : t("studentLogin.login")
                  : recoveryTitle}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {recoveryMode === "none"
                  ? isSignup
                    ? t("studentLogin.createSubtitle")
                    : t("studentLogin.loginSubtitle")
                  : "Recover your account securely using your email."}
              </p>
            </div>

            {recoveryMode === "none" ? (
              <div className="mb-6 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setError("");
                    setMessage("");
                  }}
                  disabled={loading}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${
                    !isSignup
                      ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                      : "text-slate-500"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setError("");
                    setMessage("");
                  }}
                  disabled={loading}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${
                    isSignup
                      ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                      : "text-slate-500"
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : null}

            {recoveryMode === "choose" ? (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setRecoveryMode("link");
                    setError("");
                    setMessage("");
                  }}
                  className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-slate-800"
                >
                  Send reset link
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={sendResetOtpDirect}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  Send 6-digit OTP
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {recoveryMode === "none" && isSignup && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      {t("studentLogin.fullName")}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("studentLogin.fullNamePlaceholder")}
                      autoComplete="name"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {recoveryMode !== "new-password" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      autoComplete="email"
                      disabled={loading || recoveryMode === "otp"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {recoveryMode === "none" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      {t("studentLogin.password")}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("studentLogin.passwordPlaceholder")}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400"
                    >
                      {showPassword ? "Hide password" : "Show password"}
                    </button>
                  </div>
                )}

                {recoveryMode === "link" && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    We will send a password reset link if this email is registered.
                  </p>
                )}

                {recoveryMode === "otp" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      6-digit code
                    </label>
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm tracking-[0.3em] outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {recoveryMode === "new-password" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      New password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                {message && (
                  <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : recoveryMode === "link"
                      ? "Send reset link"
                      : recoveryMode === "otp"
                        ? "Verify code"
                        : recoveryMode === "new-password"
                          ? "Update password"
                          : isSignup
                            ? t("studentLogin.createAccountButton")
                            : t("studentLogin.loginButton")}
                </button>
              </form>
            )}

            {error && recoveryMode === "choose" && (
              <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {message && recoveryMode === "choose" && (
              <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                {message}
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
              {recoveryMode === "none" && !isSignup && (
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode("choose");
                    setError("");
                    setMessage("");
                  }}
                  className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Forgot password?
                </button>
              )}

              {recoveryMode !== "none" && (
                <button
                  type="button"
                  onClick={resetRecovery}
                  disabled={loading}
                  className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Back to login
                </button>
              )}

              {recoveryMode === "none" && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isSignup
                    ? t("studentLogin.alreadyAccount")
                    : t("studentLogin.noAccount")}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup((value) => !value);
                      setError("");
                      setMessage("");
                    }}
                    disabled={loading}
                    className="ml-1 font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {isSignup
                      ? t("studentLogin.login")
                      : t("studentLogin.createAccount")}
                  </button>
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
              <span>🔐</span>
              <span>Secure student authentication</span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} Ranker Bhaiya
        </p>
      </div>
    </div>
  );

  async function sendResetOtpDirect() {
    if (loading) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await sendResetOtp();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset code.");
    } finally {
      setLoading(false);
    }
  }
}

export default StudentLogin;
