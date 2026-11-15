            );
          })}

          <button
            type="button"
            onClick={() => setMobileMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 ${
              mobileMoreOpen
                ? "text-indigo-500"
                : dark
                  ? "text-slate-500"
                  : "text-slate-500"
            }`}
          >
            <span
              className={`flex h-7 w-9 items-center justify-center rounded-xl text-lg ${
                mobileMoreOpen ? "bg-indigo-500/15" : ""
              }`}
            >
              ☰
            </span>
            <span className="text-[9px] font-black">More</span>
          </button>
        </div>
      </nav>

      {/* MOBILE MORE MENU */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMoreOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            className={`absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] border-t p-5 pb-[max(env(safe-area-inset-bottom),24px)] shadow-2xl ${
              dark
                ? "border-white/10 bg-[#0B1530]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-500/30" />

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Explore Ranker Bhaiya</h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  All your learning tools in one place
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="rounded-xl bg-slate-500/10 px-3 py-2 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {[
                {
                  icon: "📅",
                  title: "Study Planner",
                  path: "/student/study-planner",
                },
                {
                  icon: "🎯",
                  title: "Practice",
                  path: "/student/practice-questions",
                },
                {
                  icon: "⚡",
                  title: "Challenge",
                  path: "/student/daily-challenge",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`rounded-2xl border p-3 text-center ${
                    dark
                      ? "border-white/[0.07] bg-white/[0.03]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <p className="mt-2 text-[10px] font-black">{item.title}</p>
                </button>
              ))}
            </div>

            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              More learning resources
            </p>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-[10px] font-bold ${
                    dark
                      ? "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07]"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-xs font-black text-red-500"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
