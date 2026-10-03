import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type SettingRowProps = {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
  right?: React.ReactNode;
};

function SettingRow({
  icon,
  title,
  description,
  onClick,
  right,
}: SettingRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition ${
        onClick
          ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
          : "cursor-default"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-800">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        <p className="mt-0.5 text-sm leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {right ? (
        right
      ) : onClick ? (
        <span className="text-xl text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200">
          ›
        </span>
      ) : null}
    </button>
  );
}

type ToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      aria-label={enabled ? "Disable" : "Enable"}
      aria-pressed={enabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!enabled);
      }}
      className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition ${
        enabled
          ? "bg-indigo-600"
          : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [dailyCurrentAffairs, setDailyCurrentAffairs] = useState(true);
  const [newspaperUpdates, setNewspaperUpdates] = useState(true);
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [dailyGoal, setDailyGoal] = useState("60");
  const [language, setLanguage] = useState("English");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmail(user?.email ?? "");

    const savedLanguage = localStorage.getItem("ranker-bhaiya-language");
    const savedGoal = localStorage.getItem("ranker-bhaiya-daily-goal");

    const savedCurrentAffairs = localStorage.getItem(
      "ranker-bhaiya-notify-current-affairs"
    );
    const savedNewspaper = localStorage.getItem(
      "ranker-bhaiya-notify-newspaper"
    );
    const savedPractice = localStorage.getItem(
      "ranker-bhaiya-notify-practice"
    );
    const savedStreak = localStorage.getItem(
      "ranker-bhaiya-notify-streak"
    );

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedGoal) setDailyGoal(savedGoal);

    if (savedCurrentAffairs !== null) {
      setDailyCurrentAffairs(savedCurrentAffairs === "true");
    }

    if (savedNewspaper !== null) {
      setNewspaperUpdates(savedNewspaper === "true");
    }

    if (savedPractice !== null) {
      setPracticeReminders(savedPractice === "true");
    }

    if (savedStreak !== null) {
      setStreakReminders(savedStreak === "true");
    }
  }, [user?.email]);

  const isDark = theme === "dark";

  const initials = useMemo(() => {
    const value = user?.email?.split("@")[0] ?? "RB";

    return value
      .split(/[.\-_ ]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user?.email]);

  function savePreferences() {
    setSaving(true);
    setMessage("");

    localStorage.setItem("ranker-bhaiya-language", language);
    localStorage.setItem("ranker-bhaiya-daily-goal", dailyGoal);

    localStorage.setItem(
      "ranker-bhaiya-notify-current-affairs",
      String(dailyCurrentAffairs)
    );

    localStorage.setItem(
      "ranker-bhaiya-notify-newspaper",
      String(newspaperUpdates)
    );

    localStorage.setItem(
      "ranker-bhaiya-notify-practice",
      String(practiceReminders)
    );

    localStorage.setItem(
      "ranker-bhaiya-notify-streak",
      String(streakReminders)
    );

    window.setTimeout(() => {
      setSaving(false);
      setMessage("Your preferences have been saved.");
    }, 450);
  }

  async function handleLogout() {
    await signOut();
    navigate("/student/login");
  }

  async function handleChangePassword() {
    if (!email) {
      setMessage("Your email address could not be found.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/RankerBhaiya/#/student/login`,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password reset instructions have been sent to your email.");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-label="Back to dashboard"
            >
              ←
            </button>

            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Ranker Bhaiya
              </p>
              <h1 className="text-lg font-bold tracking-tight">
                Settings
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <span>{isDark ? "☀️" : "🌙"}</span>
            <span className="hidden sm:inline">
              {isDark ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                ⚙️ Personalize your experience
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Your Settings
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Manage your account, appearance, study preferences and
                notifications from one place.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black">
                {initials || "RB"}
              </div>

              <div className="max-w-[190px]">
                <p className="text-xs font-medium text-indigo-100">
                  Signed in as
                </p>
                <p className="truncate text-sm font-bold">
                  {email || "Student"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Saved message */}
        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            ✓ {message}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Account */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl dark:bg-indigo-950/50">
                  👤
                </div>

                <div>
                  <h2 className="font-bold">Account</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage your account details
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <SettingRow
                icon="🪪"
                title="Profile"
                description="Update your name, class, board and exam"
                onClick={() => navigate("/student/profile")}
              />

              <SettingRow
                icon="📧"
                title="Email address"
                description={email || "No email address available"}
                right={
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Read only
                  </span>
                }
              />

              <SettingRow
                icon="🔐"
                title="Change password"
                description="Receive a secure password reset link"
                onClick={handleChangePassword}
              />

              <SettingRow
                icon="🚪"
                title="Logout"
                description="Sign out from your Ranker Bhaiya account"
                onClick={handleLogout}
                right={
                  <span className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    Logout
                  </span>
                }
              />
            </div>
          </section>

          {/* Appearance */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-xl dark:bg-violet-950/50">
                  🎨
                </div>

                <div>
                  <h2 className="font-bold">Appearance</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Customize how Ranker Bhaiya looks
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <SettingRow
                icon={isDark ? "🌙" : "☀️"}
                title="Dark mode"
                description={
                  isDark
                    ? "Dark appearance is currently enabled"
                    : "Light appearance is currently enabled"
                }
                right={
                  <Toggle
                    enabled={isDark}
                    onChange={() => toggleTheme()}
                  />
                }
              />

              <SettingRow
                icon="✨"
                title="Interface"
                description="Clean, focused and distraction-free learning"
                right={
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    Ranker Bhaiya
                  </span>
                }
              />
            </div>
          </section>

          {/* Language */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl dark:bg-blue-950/50">
                  🌐
                </div>

                <div>
                  <h2 className="font-bold">Language</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose your preferred learning language
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-3 gap-2">
                {["English", "हिंदी", "Hinglish"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLanguage(item)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                      language === item
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Language preference is saved locally on this device.
              </p>
            </div>
          </section>

          {/* Study preferences */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xl dark:bg-amber-950/50">
                  🎯
                </div>

                <div>
                  <h2 className="font-bold">Study Preferences</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Set your daily learning target
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Daily study goal
                </span>

                <select
                  value={dailyGoal}
                  onChange={(event) => setDailyGoal(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </label>

              <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4 dark:from-indigo-950/30 dark:to-violet-950/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Consistency beats intensity
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Small daily progress builds strong preparation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl dark:bg-emerald-950/50">
                  🔔
                </div>

                <div>
                  <h2 className="font-bold">Notifications</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose which learning reminders you want
                  </p>
                </div>
              </div>
            </div>

            <div className="grid divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <SettingRow
                  icon="📰"
                  title="Daily Current Affairs"
                  description="Get reminded to stay updated"
                  right={
                    <Toggle
                      enabled={dailyCurrentAffairs}
                      onChange={setDailyCurrentAffairs}
                    />
                  }
                />

                <SettingRow
                  icon="📖"
                  title="Newspaper updates"
                  description="Daily newspaper reading reminders"
                  right={
                    <Toggle
                      enabled={newspaperUpdates}
                      onChange={setNewspaperUpdates}
                    />
                  }
                />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <SettingRow
                  icon="📝"
                  title="Practice reminders"
                  description="Remember to complete daily practice"
                  right={
                    <Toggle
                      enabled={practiceReminders}
                      onChange={setPracticeReminders}
                    />
                  }
                />

                <SettingRow
                  icon="🔥"
                  title="Streak reminders"
                  description="Don't lose your preparation streak"
                  right={
                    <Toggle
                      enabled={streakReminders}
                      onChange={setStreakReminders}
                    />
                  }
                />
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-xl dark:bg-rose-950/50">
                  🛡️
                </div>

                <div>
                  <h2 className="font-bold">Privacy & Security</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage your account security
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <SettingRow
                icon="🔒"
                title="Privacy Policy"
                description="Read how Ranker Bhaiya handles your data"
                onClick={() => navigate("/privacy-policy")}
              />

              <SettingRow
                icon="📩"
                title="Contact Support"
                description="Need help? Get in touch with us"
                onClick={() => navigate("/contact")}
              />
            </div>
          </section>

          {/* About */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-xl dark:bg-purple-950/50">
                  ℹ️
                </div>

                <div>
                  <h2 className="font-bold">About Ranker Bhaiya</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Learn more about the platform
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <SettingRow
                icon="📚"
                title="About us"
                description="Know more about Ranker Bhaiya"
                onClick={() => navigate("/about")}
              />

              <SettingRow
                icon="💬"
                title="Support"
                description="help.theharbyco@gmail.com"
                onClick={() => navigate("/contact")}
              />
            </div>
          </section>
        </div>

        {/* Save */}
        <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">Save your preferences</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your notification, language and study preferences are stored on
              this device.
            </p>
          </div>

          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        {/* Footer */}
        <footer className="py-8 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Ranker Bhaiya
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Aapki Mehnat, Hamari Strategy.
          </p>
        </footer>
      </main>
    </div>
  );
}
