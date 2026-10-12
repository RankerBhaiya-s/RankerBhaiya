
import { Outlet, useLocation } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";

export function RootLayout() {
  const { pathname } = useLocation();
  const isLearnEnglish = pathname === "/student/vocabulary";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {!isLearnEnglish && (
        <header className="sticky top-0 z-50 flex justify-end border-b border-slate-200 bg-white/95 p-3 dark:border-slate-800 dark:bg-slate-950/95">
          <LanguageToggle />
        </header>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
