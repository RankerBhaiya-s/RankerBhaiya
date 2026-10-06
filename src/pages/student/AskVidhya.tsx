import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { recordStudentActivity } from "../../lib/studentActivity";

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
   CONSTANTS
===================================================== */

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

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

  /* ===================================================
     IMAGE INPUT REFS
  =================================================== */

  const cameraInputRef =
    useRef<HTMLInputElement | null>(null);

  const galleryInputRef =
    useRef<HTMLInputElement | null>(null);

  /* ===================================================
     STATE
  =================================================== */

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

  const [imageDataUrl, setImageDataUrl] =
    useState<string | null>(null);

  const [imageName, setImageName] =
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
     CLEAR IMAGE INPUTS
  =================================================== */

  function clearImageInputs() {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  }

  /* ===================================================
     NEW CHAT
  =================================================== */

  function startNewChat() {
    setSelectedConversationId(null);
    setMessages([]);
    setQuestion("");
    setImageDataUrl(null);
    setImageName("");
    setError("");

    clearImageInputs();
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

      setConversations(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              conversation.id,
          ),
      );

      if (
        selectedConversationId ===
        conversation.id
      ) {
        setSelectedConversationId(
          null,
        );

        setMessages([]);
        setQuestion("");
        setImageDataUrl(null);
        setImageName("");

        clearImageInputs();
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
     IMAGE TO DATA URL
  =================================================== */

  function readImageAsDataUrl(
    file: File,
  ): Promise<string> {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          if (
            typeof reader.result !==
            "string"
          ) {
            reject(
              new Error(
                "Unable to read image.",
              ),
            );
            return;
          }

          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Unable to read image.",
            ),
          );
        };

        reader.readAsDataURL(file);
      },
    );
  }

  /* ===================================================
     IMAGE UPLOAD
  =================================================== */

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      event.target.value = "";

      setError(
        "Please upload a JPG, PNG or WEBP image.",
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      event.target.value = "";

      setError(
        "Image size must be 8 MB or smaller.",
      );

      return;
    }

    try {
      const dataUrl =
        await readImageAsDataUrl(
          file,
        );

      setImageDataUrl(dataUrl);
      setImageName(file.name);

      /*
       * Clear the other input so selecting
       * the same image again from another
       * source works properly.
       */
      if (
        cameraInputRef.current &&
        cameraInputRef.current !==
          event.target
      ) {
        cameraInputRef.current.value =
          "";
      }

      if (
        galleryInputRef.current &&
        galleryInputRef.current !==
          event.target
      ) {
        galleryInputRef.current.value =
          "";
      }
    } catch (err) {
      console.error(
        "Image upload error:",
        err,
      );

      setError(
        "Unable to process this image.",
      );

      event.target.value = "";
    }
  }

  /* ===================================================
     REMOVE IMAGE
  =================================================== */

  function removeImage() {
    setImageDataUrl(null);
    setImageName("");

    clearImageInputs();
  }

  /* ===================================================
     ASK VIDHYA
  =================================================== */

  async function handleAsk(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedQuestion =
      question.trim();

    if (
      !trimmedQuestion &&
      !imageDataUrl
    ) {
      setError(
        "Please enter a question or upload a photo.",
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

      const displayQuestion =
        trimmedQuestion ||
        "Please solve/explain this question from the uploaded image.";

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        "ask-padhai",
        {
          body: {
            question:
              displayQuestion,

            image_data_url:
              imageDataUrl,

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

      /* Record Ask Vidhya activity */

      const activityResult =
        await recordStudentActivity({
          userId: user.id,
          activityType:
            "ask_vidhya",
        });

      if (!activityResult.success) {
        console.error(
          "Failed to record Ask Vidhya activity:",
          activityResult.error,
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

      const userContent =
        imageDataUrl
          ? trimmedQuestion
            ? `📷 ${trimmedQuestion}\n\n[Photo attached: ${imageName || "uploaded image"}]`
            : `📷 Photo question\n\n[Photo attached: ${imageName || "uploaded image"}]`
          : trimmedQuestion;

      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,

        conversation_id:
          currentConversationId,

        role: "user",

        content:
          userContent,

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

      removeImage();

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
     HANDWRITTEN NOTES
  =================================================== */

  function openHandwrittenNotes(
    message: Message,
  ) {
    const messageIndex =
      messages.findIndex(
        (item) =>
          item.id === message.id,
      );

    let topic =
      "Ask Vidhya Notes";

    if (messageIndex > 0) {
      for (
        let index = messageIndex - 1;
        index >= 0;
        index--
      ) {
        if (
          messages[index].role ===
          "user"
        ) {
          topic =
            messages[index].content.trim() ||
            topic;

          break;
        }
      }
    }

    navigate(
      "/student/handwritten-notes",
      {
        state: {
          topic,
          content: message.content,
          source: "ask-vidhya",
        },
      },
    );
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
      {/* HEADER */}

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

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* CHAT HISTORY */}

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
              {historyLoading && (
                <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
                  <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Loading history...
                  </p>
                </div>
              )}

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
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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

          {/* CHAT AREA */}

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

            {/* MESSAGES */}

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
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

                      <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                        📷 Photo Questions
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
                        <p className="mb-2 text-xs font-semibold opacity-70">
                          {message.role ===
                          "user"
                            ? "You"
                            : "🤖 Vidhya"}
                        </p>

                        {isAssistant ? (
                          <>
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

                            {/* HANDWRITTEN NOTES */}

                            <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() =>
                                  openHandwrittenNotes(
                                    message,
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-violet-900 dark:from-violet-950/50 dark:to-blue-950/50 dark:text-violet-300"
                              >
                                <span className="text-base">
                                  ✍️
                                </span>

                                <span>
                                  Create
                                  Handwritten
                                  Notes
                                </span>
                              </button>

                              <p className="mt-2 text-[11px] text-slate-400">
                                Convert this Vidhya
                                explanation into
                                notebook-style
                                revision notes.
                              </p>
                            </div>
                          </>
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

            {/* ERROR */}

            {error && (
              <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <div className="flex items-start gap-2">
                  <span>❌</span>

                  <span>
                    {error}
                  </span>
                </div>
              </div>
            )}

            {/* ASK FORM */}

            <form
              onSubmit={handleAsk}
              className="border-t border-slate-200 p-4 dark:border-slate-800"
            >
              {/* IMAGE PREVIEW */}

              {imageDataUrl && (
                <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <div className="flex items-start gap-3">
                    <img
                      src={imageDataUrl}
                      alt="Uploaded question"
                      className="h-24 w-24 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        📷 Photo attached
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {imageName ||
                          "Uploaded image"}
                      </p>

                      <button
                        type="button"
                        onClick={
                          removeImage
                        }
                        disabled={loading}
                        className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <textarea
                value={question}
                onChange={(event) =>
                  setQuestion(
                    event.target.value,
                  )
                }
                placeholder={
                  imageDataUrl
                    ? "Ask Vidhya about this photo..."
                    : "Ask Vidhya anything about your studies..."
                }
                rows={3}
                disabled={loading}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              {/* =================================================
                  CAMERA + GALLERY
              ================================================= */}

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {/* CAMERA INPUT */}

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={
                      handleImageChange
                    }
                    className="hidden"
                  />

                  {/* GALLERY INPUT */}

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleImageChange
                    }
                    className="hidden"
                  />

                  {/* CAMERA BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
                  >
                    <span className="text-base">
                      📷
                    </span>

                    Camera
                  </button>

                  {/* GALLERY BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      galleryInputRef.current?.click()
                    }
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                  >
                    <span className="text-base">
                      🖼️
                    </span>

                    Gallery
                  </button>

                  <p className="hidden text-xs text-slate-400 sm:block">
                    JPG, PNG or WEBP • Max 8 MB
                  </p>
                </div>

                {/* ASK BUTTON */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    (!question.trim() &&
                      !imageDataUrl)
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Thinking..."
                    : "Ask Vidhya 🤖"}
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Vidhya can explain concepts,
                solve questions, analyse uploaded
                photos and help with exam
                preparation.
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AskVidhya;
