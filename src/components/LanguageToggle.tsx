
import { useTranslation } from "react-i18next";

type Language = "en" | "hi" | "hinglish";

const STORAGE_KEY = "ranker-bhaiya-language";

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const currentLanguage: Language =
    i18n.resolvedLanguage === "hi"
      ? "hi"
      : i18n.resolvedLanguage === "hinglish"
        ? "hinglish"
        : "en";

  const changeLanguage = async (language: Language) => {
    localStorage.setItem(STORAGE_KEY, language);
    localStorage.setItem("vidyzen-language", language);
    await i18n.changeLanguage(language);
  };

  return (
    <div
      className="flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
      role="group"
      aria-label="Language"
    >
      {(
        [
          ["en", "English"],
          ["hi", "हिंदी"],
          ["hinglish", "Hinglish"],
        ] as const
      ).map(([language, label]) => (
        <button
          key={language}
          type="button"
          onClick={() => changeLanguage(language)}
          aria-pressed={currentLanguage === language}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            currentLanguage === language
              ? "bg-white text-blue-600 shadow dark:bg-slate-700 dark:text-blue-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
