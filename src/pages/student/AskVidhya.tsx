import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

/* =====================================================
   TYPES
===================================================== */

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/* =====================================================
   COMPONENT
===================================================== */

export function AskVidhya() {
  const navigate = useNavigate();

  const {
    user,
    profile,
    loading: authLoading,
  } = useAuth();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<string | null>(null);

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [deletingChatId, setDeletingChatId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  /* ===================================================
     AUTH GUARD
  =================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/student/login", {
        replace: true,
      });
    }
  }, [authLoading, user, navigate]);

  /* ===================================================
     LOAD CONVERSATIONS
  =================================================== */

  async function loadConversations() {
    if (!user) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    setError("");

    try {
      const {
        data,
        error: conversationError,
      } = await supabase
        .from("ai_conversations")
        .select(
          "id, title, created_at, updated_at",
        )
        .eq("user_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (conversationError) {
        throw conversationError;
      }

      setConversations(
        (data ?? []) as Conversation[],
      );
    } catch (err) {
      console.error(
        "History error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load chat history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  /* ===================================================
     LOAD MESSAGES
  =================================================== */

  async function loadMessages(
    conversationId: string,
  ) {
    setError("");
    setSelectedConversationId(
      conversationId,
    );

    try {
      const {
        data,
        error: messagesError,
      } = await supabase
        .from("ai_messages")
        .select(
          "id, conversation_id, role, content, created_at",
        )
        .eq(
          "conversation_id",
          conversationId,
        )
        .order("created_at", {
          ascending: true,
        });

      if (messagesError) {
        throw messagesError;
      }

      setMessages(
        (data ?? []) as Message[],
      );
    } catch (err) {
      console.error(
        "Messages error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load messages.",
      );
    }
  }

  /* ===================================================
     NEW CHAT
  =================================================== */

  function startNewChat() {
    setSelectedConversationId(null);
    setMessages([]);
    setQuestion("");
    setError("");
  }

  /* ===================================================
     DELETE CHAT
  =================================================== */

  async function deleteConversation(
    conversation: Conversation,
  ) {
    if (!user) {
      setError("Please login first.");
      return;
    }

    const chatTitle =
      conversation.title?.trim() ||
      "this chat";

    const confirmed = window.confirm(
      `Delete "${chatTitle}"?\n\nThis chat and its messages will be permanently deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingChatId(
      conversation.id,
    );

    setError("");

    try {
      /*
       * Delete messages first so this also works
       * when ON DELETE CASCADE is not configured.
       */

      const {
        error: messagesDeleteError,
      } = await supabase
        .from("ai_messages")
        .delete()
        .eq(
          "conversation_id",
          conversation.id,
        );

      if (messagesDeleteError) {
        throw messagesDeleteError;
      }

      /* Delete conversation */

      const {
        error: conversationDeleteError,
      } = await supabase
        .from("ai_conversations")
        .delete()
        .eq(
          "id",
          conversation.id,
        )
        .eq(
          "user_id",
          user.id,
        );

      if (conversationDeleteError) {
        throw conversationDeleteError;
      }

      /* Update local history */

      setConversations(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              conversation.id,
          ),
      );

      /* Reset if currently opened */

      if (
        selectedConversationId ===
        conversation.id
      ) {
        setSelectedConversationId(
          null,
        );

        setMessages([]);
        setQuestion("");
      }
    } catch (err) {
      console.error(
        "Delete conversation error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this chat.",
      );
    } finally {
      setDeletingChatId(null);
    }
  }

  /* ===================================================
     INITIAL HISTORY
  =================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setHistoryLoading(false);
      return;
    }

    void loadConversations();
  }, [authLoading, user]);

  /* ===================================================
     ASK VIDHYA
  =================================================== */

  async function handleAsk(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedQuestion =
      question.trim();

    if (!trimmedQuestion) {
      setError(
        "Please enter your question.",
      );
      return;
    }

    if (!user) {
      setError(
        "Please login first.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log(
        "========================================",
      );

      console.log(
        "🤖 ASK VIDHYA START",
      );

      console.log(
        "========================================",
      );

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "ask-padhai",
        {
          body: {
            question:
              trimmedQuestion,

            conversation_id:
              selectedConversationId,

            student: {
              class_name:
                profile?.class_name ??
                null,

              board:
                profile?.board ??
                null,

              exam:
                profile?.exam ??
                null,
            },
          },
        },
      );

      console.log(
        "📦 Ask Vidhya Response:",
        data,
      );

      if (functionError) {
        console.error(
          "❌ Ask Vidhya Function Error:",
          functionError,
        );

        throw functionError;
      }

      if (data?.error) {
        throw new Error(
          data.error,
        );
      }

      if (
        !data?.answer ||
        typeof data.answer !==
          "string"
      ) {
        throw new Error(
          "AI did not return an answer.",
        );
      }

      const conversationId =
        typeof data.conversation_id ===
        "string"
          ? data.conversation_id
          : selectedConversationId;

      if (conversationId) {
        setSelectedConversationId(
          conversationId,
        );
      }

      const now =
        new Date().toISOString();

      const currentConversationId =
        conversationId || "";

      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,

        conversation_id:
          currentConversationId,

        role: "user",

        content:
          trimmedQuestion,

        created_at: now,
      };

      const aiMessage: Message = {
        id: `temp-ai-${Date.now()}`,

        conversation_id:
          currentConversationId,

        role: "assistant",

        content:
          data.answer,

        created_at: now,
      };

      setMessages(
        (previous) => [
          ...previous,
          userMessage,
          aiMessage,
        ],
      );

      setQuestion("");

      /*
       * Refresh chat history so the newly
       * created conversation/title appears.
       */

      await loadConversations();

      console.log(
        "✅ Ask Vidhya completed successfully.",
      );
    } catch (err) {
      console.error(
        "========================================",
      );

      console.error(
        "❌ ASK VIDHYA ERROR",
      );

      console.error(err);

      console.error(
        "========================================",
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect with Vidhya.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ===================================================
     FORMAT DATE
  =================================================== */

  function formatDate(
    date: string,
  ) {
    return new Date(
      date,
    ).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  /* ===================================================
     AUTH LOADING
  =================================================== */

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Loading Ask Vidhya...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* ===================================================
     UI
  =================================================== */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/dashboard",
              )
            }
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-sm">
              R
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-blue-600">
                RANKER BHAIYA
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ask Vidhya • AI Study Assistant
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/dashboard",
              )
            }
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* =================================================
              CHAT HISTORY
          ================================================= */}

          <aside className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">
                Chat History
              </h2>

              <button
                type="button"
                onClick={
                  startNewChat
                }
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                + New Chat
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {/* LOADING */}

              {historyLoading && (
                <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Loading history...
                  </p>
                </div>
              )}

              {/* EMPTY */}

              {!historyLoading &&
                conversations.length ===
                  0 && (
                  <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
                    <div className="text-2xl">
                      💬
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      No previous chats.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Start a new question.
                    </p>
                  </div>
                )}

              {/* HISTORY */}

              {conversations.map(
                (conversation) => (
                  <div
                    key={
                      conversation.id
                    }
                    className={`group flex items-center gap-1 rounded-xl transition ${
                      selectedConversationId ===
                      conversation.id
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {/* CHAT */}

                    <button
                      type="button"
                      onClick={() =>
                        void loadMessages(
                          conversation.id,
                        )
                      }
                      disabled={
                        deletingChatId ===
                        conversation.id
                      }
                      className={`min-w-0 flex-1 rounded-xl p-3 text-left ${
                        selectedConversationId ===
                        conversation.id
                          ? "text-blue-700 dark:text-blue-300"
                          : ""
                      }`}
                    >
                      <p className="line-clamp-2 text-sm font-semibold">
                        {conversation.title ||
                          "New Chat"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(
                          conversation.updated_at,
                        )}
                      </p>
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        void deleteConversation(
                          conversation,
                        )
                      }
                      disabled={
                        deletingChatId ===
                        conversation.id
                      }
                      aria-label={`Delete ${
                        conversation.title ||
                        "chat"
                      }`}
                      title="Delete chat"
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:opacity-100"
                    >
                      {deletingChatId ===
                      conversation.id
                        ? "..."
                        : "🗑️"}
                    </button>
                  </div>
                ),
              )}
            </div>
          </aside>

          {/* =================================================
              CHAT AREA
          ================================================= */}

          <section className="flex min-h-[650px] flex-col rounded-2xl bg-white shadow-sm dark:bg-slate-900">
            {/* STUDENT CONTEXT */}

            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Asking as
                  </p>

                  <h2 className="mt-1 font-bold">
                    {profile?.full_name ||
                      user.email ||
                      "Student"}
                  </h2>
                </div>

                <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  🤖 Vidhya AI
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {profile?.class_name && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    Class{" "}
                    {profile.class_name}
                  </span>
                )}

                {profile?.board && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/50 dark:text-green-300">
                    {profile.board}
                  </span>
                )}

                {profile?.exam && (
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    {profile.exam}
                  </span>
                )}
              </div>
            </div>

            {/* =================================================
                MESSAGES
            ================================================= */}

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* EMPTY CHAT */}

              {messages.length ===
                0 && (
                <div className="flex min-h-[420px] items-center justify-center text-center">
                  <div className="max-w-md">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-4xl dark:from-blue-950/50 dark:to-indigo-950/50">
                      🤖
                    </div>

                    <h2 className="mt-5 text-2xl font-black">
                      Ask Vidhya
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Ask a question about
                      your studies and
                      Vidhya will explain
                      it step by step.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        📚 Concepts
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        📝 Exam Prep
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        💡 Explanations
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MESSAGES */}

              {messages.map(
                (message) => {
                  const isAssistant =
                    message.role ===
                    "assistant";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role ===
                        "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${
                          message.role ===
                          "user"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {/* SENDER */}

                        <p className="mb-2 text-xs font-semibold opacity-70">
                          {message.role ===
                          "user"
                            ? "You"
                            : "🤖 Vidhya"}
                        </p>

                        {/* AI */}

                        {isAssistant ? (
                          <div className="padhai-markdown text-sm leading-7">
                            <ReactMarkdown
                              remarkPlugins={[
                                remarkGfm,
                              ]}
                              components={{
                                h1: ({
                                  children,
                                }) => (
                                  <h1 className="mb-4 mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                    {
                                      children
                                    }
                                  </h1>
                                ),

                                h2: ({
                                  children,
                                }) => (
                                  <h2 className="mb-3 mt-5 text-lg font-bold text-slate-900 dark:text-white">
                                    {
                                      children
                                    }
                                  </h2>
                                ),

                                h3: ({
                                  children,
                                }) => (
                                  <h3 className="mb-2 mt-4 text-base font-bold text-slate-900 dark:text-white">
                                    {
                                      children
                                    }
                                  </h3>
                                ),

                                p: ({
                                  children,
                                }) => (
                                  <p className="mb-3 last:mb-0">
                                    {
                                      children
                                    }
                                  </p>
                                ),

                                strong: ({
                                  children,
                                }) => (
                                  <strong className="font-bold text-slate-900 dark:text-white">
                                    {
                                      children
                                    }
                                  </strong>
                                ),

                                em: ({
                                  children,
                                }) => (
                                  <em className="italic">
                                    {
                                      children
                                    }
                                  </em>
                                ),

                                ul: ({
                                  children,
                                }) => (
                                  <ul className="mb-4 ml-5 list-disc space-y-1">
                                    {
                                      children
                                    }
                                  </ul>
                                ),

                                ol: ({
                                  children,
                                }) => (
                                  <ol className="mb-4 ml-5 list-decimal space-y-1">
                                    {
                                      children
                                    }
                                  </ol>
                                ),

                                li: ({
                                  children,
                                }) => (
                                  <li className="pl-1">
                                    {
                                      children
                                    }
                                  </li>
                                ),

                                blockquote: ({
                                  children,
                                }) => (
                                  <blockquote className="my-4 border-l-4 border-blue-400 pl-4 italic text-slate-600 dark:text-slate-300">
                                    {
                                      children
                                    }
                                  </blockquote>
                                ),

                                code: ({
                                  children,
                                }) => (
                                  <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                                    {
                                      children
                                    }
                                  </code>
                                ),

                                pre: ({
                                  children,
                                }) => (
                                  <pre className="my-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
                                    {
                                      children
                                    }
                                  </pre>
                                ),

                                table: ({
                                  children,
                                }) => (
                                  <div className="my-4 overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-700">
                                    <table className="min-w-full border-collapse text-sm">
                                      {
                                        children
                                      }
                                    </table>
                                  </div>
                                ),

                                thead: ({
                                  children,
                                }) => (
                                  <thead className="bg-slate-200 dark:bg-slate-700">
                                    {
                                      children
                                    }
                                  </thead>
                                ),

                                th: ({
                                  children,
                                }) => (
                                  <th className="border-b border-slate-300 px-3 py-2 text-left font-bold dark:border-slate-600">
                                    {
                                      children
                                    }
                                  </th>
                                ),

                                td: ({
                                  children,
                                }) => (
                                  <td className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                                    {
                                      children
                                    }
                                  </td>
                                ),

                                hr: () => (
                                  <hr className="my-5 border-slate-300 dark:border-slate-700" />
                                ),

                                a: ({
                                  children,
                                  href,
                                }) => (
                                  <a
                                    href={
                                      href
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-blue-600 underline dark:text-blue-400"
                                  >
                                    {
                                      children
                                    }
                                  </a>
                                ),
                              }}
                            >
                              {
                                message.content
                              }
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm leading-7">
                            {
                              message.content
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}

              {/* THINKING */}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                      </span>

                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Vidhya is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <div className="flex items-start gap-2">
                  <span>
                    ❌
                  </span>

                  <span>
                    {error}
                  </span>
                </div>
              </div>
            )}

            {/* =================================================
                ASK FORM
            ================================================= */}

            <form
              onSubmit={handleAsk}
              className="border-t border-slate-200 p-4 dark:border-slate-800"
            >
              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(
                    event.target.value,
                  )
                }
                placeholder="Ask Vidhya anything about your studies..."
                rows={3}
                disabled={loading}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Vidhya can explain
                  concepts, solve
                  questions and help with
                  exam preparation.
                </p>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !question.trim()
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Thinking..."
                    : "Ask Vidhya 🤖"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AskVidhya;
