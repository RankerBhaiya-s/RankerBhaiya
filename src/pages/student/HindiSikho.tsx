
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type Module = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  lessons: {
    title: string;
    content: string;
    examples: string[];
  }[];
  questions: Question[];
};

const modules: Module[] = [
  {
    id: "grammar",
    title: "हिंदी व्याकरण",
    subtitle: "Hindi Grammar",
    icon: "📖",
    color: "from-violet-500 to-indigo-600",
    description: "भाषा के नियमों को समझें और अपनी व्याकरण की नींव मजबूत करें।",
    lessons: [
      {
        title: "संज्ञा",
        content: "किसी व्यक्ति, वस्तु, स्थान, प्राणी या भाव के नाम को संज्ञा कहते हैं।",
        examples: ["राम — व्यक्तिवाचक संज्ञा", "दिल्ली — स्थान का नाम", "ईमानदारी — भाववाचक संज्ञा"],
      },
      {
        title: "सर्वनाम",
        content: "संज्ञा के स्थान पर प्रयोग किए जाने वाले शब्दों को सर्वनाम कहते हैं।",
        examples: ["मैं", "तुम", "वह", "हम", "वे"],
      },
      {
        title: "विशेषण",
        content: "जो शब्द संज्ञा या सर्वनाम की विशेषता बताते हैं, उन्हें विशेषण कहते हैं।",
        examples: ["सुंदर फूल", "लंबा पेड़", "मेहनती विद्यार्थी"],
      },
      {
        title: "क्रिया",
        content: "जिस शब्द से किसी काम के करने या होने का बोध होता है, उसे क्रिया कहते हैं।",
        examples: ["राम पढ़ता है।", "बच्चे खेल रहे हैं।", "पक्षी उड़ते हैं।"],
      },
    ],
    questions: [
      {
        question: "किसी व्यक्ति, वस्तु या स्थान के नाम को क्या कहते हैं?",
        options: ["सर्वनाम", "संज्ञा", "विशेषण", "क्रिया"],
        answer: 1,
        explanation: "व्यक्ति, वस्तु, स्थान या भाव के नाम को संज्ञा कहते हैं।",
      },
      {
        question: "संज्ञा के स्थान पर प्रयुक्त शब्द क्या कहलाते हैं?",
        options: ["विशेषण", "क्रिया", "सर्वनाम", "अव्यय"],
        answer: 2,
        explanation: "संज्ञा के स्थान पर आने वाले शब्द सर्वनाम कहलाते हैं।",
      },
      {
        question: "'सुंदर फूल' में विशेषण कौन-सा है?",
        options: ["सुंदर", "फूल", "में", "कोई नहीं"],
        answer: 0,
        explanation: "सुंदर शब्द फूल की विशेषता बता रहा है।",
      },
    ],
  },
  {
    id: "vocabulary",
    title: "शब्द भंडार",
    subtitle: "Vocabulary Builder",
    icon: "🔤",
    color: "from-blue-500 to-cyan-500",
    description: "पर्यायवाची, विलोम और उपयोगी हिंदी शब्द सीखें।",
    lessons: [
      {
        title: "पर्यायवाची शब्द",
        content: "समान या लगभग समान अर्थ बताने वाले शब्द पर्यायवाची कहलाते हैं।",
        examples: ["सूर्य — रवि, भानु, दिनकर", "पृथ्वी — धरती, धरा, वसुंधरा", "जल — नीर, पानी, वारि"],
      },
      {
        title: "विलोम शब्द",
        content: "एक-दूसरे के विपरीत अर्थ वाले शब्द विलोम कहलाते हैं।",
        examples: ["दिन — रात", "लाभ — हानि", "आशा — निराशा"],
      },
      {
        title: "अनेक शब्दों के लिए एक शब्द",
        content: "कई शब्दों के स्थान पर प्रयोग होने वाला एक सार्थक शब्द इस श्रेणी में आता है।",
        examples: ["जो कभी न मरे — अमर", "जो सब कुछ जानता हो — सर्वज्ञ", "जो पढ़ा-लिखा न हो — निरक्षर"],
      },
    ],
    questions: [
      {
        question: "'सूर्य' का पर्यायवाची शब्द कौन-सा है?",
        options: ["रात्रि", "रवि", "पवन", "बादल"],
        answer: 1,
        explanation: "रवि, सूर्य का पर्यायवाची शब्द है।",
      },
      {
        question: "'लाभ' का विलोम क्या है?",
        options: ["धन", "आय", "हानि", "विजय"],
        answer: 2,
        explanation: "लाभ का विपरीत अर्थ हानि होता है।",
      },
      {
        question: "जो कभी न मरे, उसे क्या कहते हैं?",
        options: ["अमर", "अज्ञानी", "नश्वर", "निरक्षर"],
        answer: 0,
        explanation: "जो कभी न मरे, उसके लिए अमर शब्द प्रयोग होता है।",
      },
    ],
  },
  {
    id: "sandhi",
    title: "संधि और समास",
    subtitle: "Sandhi & Samas",
    icon: "🧩",
    color: "from-orange-500 to-amber-500",
    description: "शब्द निर्माण के महत्वपूर्ण नियम उदाहरणों के साथ सीखें।",
    lessons: [
      {
        title: "संधि",
        content: "दो वर्णों के मेल से होने वाले विकार को संधि कहते हैं। संधि के प्रमुख प्रकार स्वर, व्यंजन और विसर्ग संधि हैं।",
        examples: ["विद्या + आलय = विद्यालय", "महा + ईश = महेश", "सत् + जन = सज्जन"],
      },
      {
        title: "स्वर संधि",
        content: "जब दो स्वरों के मेल से परिवर्तन होता है, तो उसे स्वर संधि कहते हैं।",
        examples: ["महा + ईश = महेश", "नर + इंद्र = नरेंद्र"],
      },
      {
        title: "समास",
        content: "दो या दो से अधिक शब्दों के मेल से बने संक्षिप्त शब्द को समास कहते हैं।",
        examples: ["राजपुत्र — राजा का पुत्र", "नीलकमल — नीला है जो कमल", "माता-पिता — माता और पिता"],
      },
    ],
    questions: [
      {
        question: "दो वर्णों के मेल से होने वाले परिवर्तन को क्या कहते हैं?",
        options: ["समास", "संधि", "प्रत्यय", "उपसर्ग"],
        answer: 1,
        explanation: "दो वर्णों के मेल से होने वाले विकार को संधि कहते हैं।",
      },
      {
        question: "समास का अर्थ क्या है?",
        options: ["विस्तार", "संक्षेप", "विलोम", "उच्चारण"],
        answer: 1,
        explanation: "समास में शब्दों को मिलाकर संक्षिप्त रूप बनाया जाता है।",
      },
      {
        question: "संधि के प्रमुख प्रकार कितने हैं?",
        options: ["दो", "तीन", "चार", "पाँच"],
        answer: 1,
        explanation: "स्वर, व्यंजन और विसर्ग — संधि के तीन प्रमुख प्रकार हैं।",
      },
    ],
  },
  {
    id: "idioms",
    title: "मुहावरे और लोकोक्तियाँ",
    subtitle: "Idioms & Proverbs",
    icon: "💬",
    color: "from-pink-500 to-rose-500",
    description: "प्रचलित मुहावरों और लोकोक्तियों के अर्थ समझें।",
    lessons: [
      {
        title: "मुहावरे",
        content: "ऐसा वाक्यांश जिसका अर्थ उसके सामान्य शब्दार्थ से अलग होता है, मुहावरा कहलाता है।",
        examples: ["आँखों का तारा — बहुत प्यारा", "नाक कटना — अपमान होना", "दाँत खट्टे करना — बुरी तरह हराना"],
      },
      {
        title: "लोकोक्तियाँ",
        content: "लोक अनुभव पर आधारित प्रचलित कथन, जो किसी सीख या सत्य को व्यक्त करते हैं, लोकोक्ति कहलाते हैं।",
        examples: ["जैसी करनी वैसी भरनी", "एकता में बल है", "देर आए दुरुस्त आए"],
      },
    ],
    questions: [
      {
        question: "'आँखों का तारा' मुहावरे का अर्थ क्या है?",
        options: ["बहुत प्यारा", "बहुत गुस्सा", "बहुत दूर", "बहुत तेज"],
        answer: 0,
        explanation: "आँखों का तारा अर्थात अत्यंत प्रिय व्यक्ति।",
      },
      {
        question: "'नाक कटना' का अर्थ क्या है?",
        options: ["बीमार होना", "अपमान होना", "खुश होना", "डर जाना"],
        answer: 1,
        explanation: "नाक कटना का अर्थ अपमानित होना है।",
      },
      {
        question: "'जैसी करनी वैसी भरनी' क्या है?",
        options: ["संधि", "समास", "लोकोक्ति", "विशेषण"],
        answer: 2,
        explanation: "यह एक प्रचलित लोकोक्ति है।",
      },
    ],
  },
  {
    id: "spelling",
    title: "वर्तनी अभ्यास",
    subtitle: "Correct Spellings",
    icon: "✍️",
    color: "from-teal-500 to-emerald-500",
    description: "शुद्ध और अशुद्ध शब्दों की पहचान करना सीखें।",
    lessons: [
      {
        title: "शुद्ध वर्तनी",
        content: "शब्दों को भाषा के मानक नियमों के अनुसार सही रूप में लिखना शुद्ध वर्तनी कहलाता है।",
        examples: ["आशीर्वाद", "उज्ज्वल", "कृपया", "स्वास्थ्य", "आवश्यक"],
      },
      {
        title: "सामान्य अशुद्धियाँ",
        content: "समान उच्चारण वाले शब्दों में मात्रा और अक्षरों की गलती से वर्तनी अशुद्ध हो सकती है।",
        examples: ["आर्शीवाद ❌ → आशीर्वाद ✓", "उज्वल ❌ → उज्ज्वल ✓", "किरपया ❌ → कृपया ✓"],
      },
    ],
    questions: [
      {
        question: "इनमें से शुद्ध शब्द कौन-सा है?",
        options: ["आर्शीवाद", "आशीर्वाद", "आशिर्वाद", "आर्शिवाद"],
        answer: 1,
        explanation: "आशीर्वाद सही वर्तनी है।",
      },
      {
        question: "कौन-सा शब्द शुद्ध है?",
        options: ["उज्वल", "उज्जवल", "उज्ज्वल", "उजवल"],
        answer: 2,
        explanation: "उज्ज्वल सही वर्तनी है।",
      },
      {
        question: "सही शब्द चुनिए।",
        options: ["किरपया", "कृपया", "कृपिया", "कृप्या"],
        answer: 1,
        explanation: "कृपया सही वर्तनी है।",
      },
    ],
  },
  {
    id: "quiz",
    title: "हिंदी MCQ Quiz",
    subtitle: "Test Your Knowledge",
    icon: "🎯",
    color: "from-indigo-500 to-purple-600",
    description: "विभिन्न विषयों पर आधारित प्रश्नों से अपना ज्ञान जाँचें।",
    lessons: [
      {
        title: "Quiz कैसे खेलें?",
        content: "प्रत्येक प्रश्न के चार विकल्प होंगे। सही विकल्प चुनने पर आपको तुरंत परिणाम और उत्तर का स्पष्टीकरण मिलेगा।",
        examples: ["हर सही उत्तर पर 10 अंक", "हर प्रश्न का एक सही उत्तर", "अंत में अपना स्कोर देखें"],
      },
    ],
    questions: [
      {
        question: "'कमल' का पर्यायवाची क्या है?",
        options: ["पंकज", "पवन", "अनल", "गगन"],
        answer: 0,
        explanation: "पंकज, कमल का पर्यायवाची है।",
      },
      {
        question: "'उन्नति' का विलोम क्या है?",
        options: ["प्रगति", "विकास", "अवनति", "सफलता"],
        answer: 2,
        explanation: "उन्नति का विलोम अवनति है।",
      },
      {
        question: "जो दूसरों का भला करे, उसे क्या कहते हैं?",
        options: ["स्वार्थी", "परोपकारी", "अज्ञानी", "निराश"],
        answer: 1,
        explanation: "दूसरों का भला करने वाला परोपकारी कहलाता है।",
      },
      {
        question: "'दाँत खट्टे करना' का अर्थ है?",
        options: ["भोजन करना", "बुरी तरह हराना", "हँसना", "डरना"],
        answer: 1,
        explanation: "इस मुहावरे का अर्थ किसी को बुरी तरह पराजित करना है।",
      },
    ],
  },
  {
    id: "daily",
    title: "Daily Hindi Challenge",
    subtitle: "Daily Practice",
    icon: "🔥",
    color: "from-red-500 to-orange-500",
    description: "हर दिन छोटे अभ्यास से हिंदी की तैयारी जारी रखें।",
    lessons: [
      {
        title: "आज का अभ्यास",
        content: "प्रतिदिन कुछ नए शब्द, एक मुहावरा और व्याकरण का एक नियम दोहराएँ। नियमित अभ्यास से समझ मजबूत होती है।",
        examples: ["5 पर्यायवाची याद करें", "5 विलोम शब्द दोहराएँ", "3 MCQ हल करें"],
      },
    ],
    questions: [
      {
        question: "'निर्मल' का विलोम क्या है?",
        options: ["स्वच्छ", "मलिन", "सुंदर", "सरल"],
        answer: 1,
        explanation: "निर्मल का विलोम मलिन है।",
      },
      {
        question: "'पवन' का पर्यायवाची क्या है?",
        options: ["जल", "अग्नि", "वायु", "धरती"],
        answer: 2,
        explanation: "पवन का अर्थ वायु होता है।",
      },
      {
        question: "'हाथ पर हाथ धरे बैठना' का अर्थ क्या है?",
        options: ["काम करना", "निष्क्रिय बैठना", "लिखना", "सहायता करना"],
        answer: 1,
        explanation: "इसका अर्थ बिना काम किए बैठे रहना है।",
      },
    ],
  },
];

const STORAGE_KEY = "ranker-bhaiya-hindi-progress";

function readProgress(): Record<string, number> {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export default function HindiSikho() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>(readProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const totalAttempts = useMemo(
    () => Object.values(progress).reduce((sum, value) => sum + value, 0),
    [progress],
  );

  const completedModules = modules.filter((m) => progress[m.id] > 0).length;

  const totalQuestions = modules.reduce(
    (sum, module) => sum + module.questions.length,
    0,
  );

  const currentQuestion = quizStarted
    ? selectedModule?.questions[questionIndex]
    : undefined;

  const pageBg = dark
    ? "bg-[#060A16] text-white"
    : "bg-[#F5F7FC] text-slate-900";

  const panel = dark
    ? "border-white/[0.07] bg-[#10182B]"
    : "border-slate-200 bg-white";

  const muted = dark ? "text-slate-400" : "text-slate-500";

  const openModule = (module: Module) => {
    setSelectedModule(module);
    setSelectedLesson(0);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setQuizStarted(false);
  };

  const closeModule = () => {
    setSelectedModule(null);
    setQuizStarted(false);
    setQuizFinished(false);
    setSelectedAnswer(null);
  };

  const startQuiz = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  const chooseAnswer = (index: number) => {
    if (!currentQuestion || selectedAnswer !== null) return;

    setSelectedAnswer(index);

    if (index === currentQuestion.answer) {
      setScore((value) => value + 10);
    }
  };

  const nextQuestion = () => {
    if (!selectedModule) return;

    if (questionIndex + 1 < selectedModule.questions.length) {
      setQuestionIndex((value) => value + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
      setProgress((previous) => ({
        ...previous,
        [selectedModule.id]: (previous[selectedModule.id] || 0) + 1,
      }));
    }
  };

  // ================= MODULE VIEW =================

  if (selectedModule) {
    const lesson = selectedModule.lessons[selectedLesson];

    return (
      <div className={`min-h-screen ${pageBg}`}>
        <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          dark
            ? "border-white/[0.07] bg-[#060A16]/90"
            : "border-slate-200 bg-white/90"
        }`}>
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={closeModule}
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition hover:-translate-y-0.5 ${
                dark
                  ? "border-white/10 hover:bg-white/5"
                  : "border-slate-200 hover:bg-slate-100"
              }`}
            >
              ← वापस
            </button>

            <div className="text-center">
              <p className="text-sm font-black">Ranker Bhaiya</p>
              <p className={`text-[10px] ${muted}`}>Hindi Learning</p>
            </div>

            <button
              onClick={() => navigate("/student/dashboard")}
              className="rounded-xl bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-500 transition hover:bg-indigo-500/20"
            >
              Dashboard
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${selectedModule.color} p-6 text-white shadow-xl sm:p-9`}>
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl backdrop-blur-xl">
                  {selectedModule.icon}
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                  {selectedModule.subtitle}
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {selectedModule.title}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">
                  {selectedModule.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] font-bold text-white/70">Lessons</p>
                  <p className="mt-1 text-2xl font-black">{selectedModule.lessons.length}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] font-bold text-white/70">Questions</p>
                  <p className="mt-1 text-2xl font-black">{selectedModule.questions.length}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={`h-fit rounded-[26px] border p-5 ${panel}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black">Learning Chapters</h2>
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black text-indigo-500">
                  {selectedModule.lessons.length}
                </span>
              </div>

              <p className={`mt-2 text-xs ${muted}`}>
                अपना lesson चुनें
              </p>

              <div className="mt-5 space-y-2">
                {selectedModule.lessons.map((item, index) => (
                  <button
                    key={item.title}
                    onClick={() => {
                      setSelectedLesson(index);
                      setQuizStarted(false);
                      setQuizFinished(false);
                    }}
                    className={`w-full rounded-2xl p-4 text-left transition ${
                      selectedLesson === index && !quizStarted
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : dark
                          ? "bg-white/[0.03] hover:bg-white/[0.07]"
                          : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        selectedLesson === index && !quizStarted
                          ? "bg-white/15"
                          : "bg-indigo-500/10 text-indigo-500"
                      }`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-bold">{item.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={startQuiz}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-left text-white shadow-lg shadow-orange-500/10 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
                    🎯
                  </span>
                  <div>
                    <p className="text-sm font-black">Practice Quiz</p>
                    <p className="mt-1 text-[10px] text-white/80">अपना ज्ञान जाँचें</p>
                  </div>
                </div>
              </button>

              <div className={`mt-5 rounded-2xl p-4 ${
                dark ? "bg-white/[0.03]" : "bg-indigo-50"
              }`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                  Your Attempts
                </p>
                <p className="mt-2 text-2xl font-black">
                  {progress[selectedModule.id] || 0}
                </p>
                <p className={`mt-1 text-xs ${muted}`}>
                  इस module में quiz attempts
                </p>
              </div>
            </aside>

            <section className="min-w-0 space-y-6">
              {!quizStarted && (
                <article className={`rounded-[26px] border p-6 sm:p-8 ${panel}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-500">
                      Lesson {selectedLesson + 1}
                    </span>
                    <span className={`text-xs font-bold ${muted}`}>
                      {selectedLesson + 1} / {selectedModule.lessons.length}
                    </span>
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-500/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                      style={{
                        width: `${((selectedLesson + 1) / selectedModule.lessons.length) * 100}%`,
                      }}
                    />
                  </div>

                  <h2 className="mt-7 text-2xl font-black sm:text-3xl">
                    {lesson.title}
                  </h2>

                  <p className={`mt-5 text-sm leading-8 sm:text-base ${muted}`}>
                    {lesson.content}
                  </p>

                  <div className={`mt-7 rounded-[24px] border p-5 sm:p-6 ${
                    dark
                      ? "border-indigo-500/15 bg-indigo-500/[0.05]"
                      : "border-indigo-100 bg-indigo-50/70"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-xl">
                        💡
                      </span>
                      <h3 className="text-base font-black text-indigo-500">
                        उदाहरण और अभ्यास
                      </h3>
                    </div>

                    <ul className="mt-5 space-y-4">
                      {lesson.examples.map((example, index) => (
                        <li key={example} className="flex items-start gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-black text-emerald-500">
                            {index + 1}
                          </span>
                          <span className="pt-1 text-sm font-medium leading-6">
                            {example}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 flex flex-wrap justify-between gap-3">
                    <button
                      disabled={selectedLesson === 0}
                      onClick={() => setSelectedLesson((value) => value - 1)}
                      className={`rounded-xl border px-5 py-3 text-xs font-bold transition disabled:opacity-30 ${
                        dark
                          ? "border-white/10 hover:bg-white/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ← पिछला पाठ
                    </button>

                    <button
                      disabled={selectedLesson === selectedModule.lessons.length - 1}
                      onClick={() => setSelectedLesson((value) => value + 1)}
                      className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-indigo-600/15 transition hover:-translate-y-0.5 disabled:opacity-30"
                    >
                      अगला पाठ →
                    </button>
                  </div>
                </article>
              )}

              {!quizStarted && (
                <section className={`rounded-[26px] border p-6 sm:p-7 ${panel}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                        Practice Zone
                      </p>
                      <h3 className="mt-2 text-xl font-black">
                        अपनी तैयारी जाँचें
                      </h3>
                      <p className={`mt-2 text-xs leading-6 ${muted}`}>
                        इस module के प्रश्न हल करें और अपना स्कोर देखें।
                      </p>
                    </div>

                    <button
                      onClick={startQuiz}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-indigo-500/15 transition hover:-translate-y-0.5"
                    >
                      Quiz शुरू करें →
                    </button>
                  </div>
                </section>
              )}

              {quizStarted && currentQuestion && (
                <section className={`rounded-[26px] border p-6 sm:p-8 ${panel}`}>
                  {!quizFinished ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-violet-500">
                          Practice Quiz
                        </span>
                        <span className={`text-xs font-bold ${muted}`}>
                          प्रश्न {questionIndex + 1} / {selectedModule.questions.length}
                        </span>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-500/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                          style={{
                            width: `${((questionIndex + 1) / selectedModule.questions.length) * 100}%`,
                          }}
                        />
                      </div>

                      <h2 className="mt-7 text-xl font-black leading-8 sm:text-2xl">
                        {currentQuestion.question}
                      </h2>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {currentQuestion.options.map((option, index) => {
                          const isCorrect = index === currentQuestion.answer;
                          const isSelected = selectedAnswer === index;

                          let style = dark
                            ? "border-white/10 bg-white/[0.03] hover:border-indigo-400/50"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-300";

                          if (selectedAnswer !== null && isCorrect) {
                            style = "border-emerald-500 bg-emerald-500/10 text-emerald-500";
                          } else if (isSelected && !isCorrect) {
                            style = "border-rose-500 bg-rose-500/10 text-rose-500";
                          }

                          return (
                            <button
                              key={option}
                              disabled={selectedAnswer !== null}
                              onClick={() => chooseAnswer(index)}
                              className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${style}`}
                            >
                              <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 text-xs">
                                {String.fromCharCode(65 + index)}
                              </span>
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {selectedAnswer !== null && (
                        <div className={`mt-6 rounded-2xl border p-5 ${
                          selectedAnswer === currentQuestion.answer
                            ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-500"
                            : "border-rose-500/20 bg-rose-500/[0.08] text-rose-500"
                        }`}>
                          <p className="font-black">
                            {selectedAnswer === currentQuestion.answer
                              ? "✓ बिल्कुल सही!"
                              : "✕ सही उत्तर: " + currentQuestion.options[currentQuestion.answer]}
                          </p>

                          <p className="mt-3 text-sm leading-7">
                            {currentQuestion.explanation}
                          </p>

                          <button
                            onClick={nextQuestion}
                            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white"
                          >
                            {questionIndex === selectedModule.questions.length - 1
                              ? "परिणाम देखें"
                              : "अगला प्रश्न →"}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-amber-400 to-orange-500 text-5xl shadow-xl shadow-orange-500/20">
                        🏆
                      </div>

                      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-indigo-500">
                        Quiz Completed
                      </p>

                      <h2 className="mt-3 text-3xl font-black">
                        शानदार प्रयास!
                      </h2>

                      <p className={`mt-3 text-sm ${muted}`}>
                        आपने इस quiz के सभी प्रश्नों का अभ्यास पूरा किया।
                      </p>

                      <div className={`mx-auto mt-7 max-w-sm rounded-[26px] border p-6 ${panel}`}>
                        <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                          आपका स्कोर
                        </p>
                        <p className="mt-3 text-5xl font-black text-indigo-500">
                          {score}
                          <span className={`text-2xl ${muted}`}>
                            /{selectedModule.questions.length * 10}
                          </span>
                        </p>
                        <p className={`mt-3 text-xs ${muted}`}>
                          {Math.round((score / (selectedModule.questions.length * 10)) * 100)}% सही स्कोर
                        </p>
                      </div>

                      <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <button
                          onClick={startQuiz}
                          className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white"
                        >
                          फिर से प्रयास करें
                        </button>

                        <button
                          onClick={closeModule}
                          className={`rounded-xl border px-5 py-3 text-xs font-bold ${
                            dark
                              ? "border-white/10"
                              : "border-slate-200"
                          }`}
                        >
                          सभी Modules देखें
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </section>
          </div>
        </main>

        <footer className={`border-t px-4 py-8 text-center text-xs ${muted} ${
          dark ? "border-white/[0.07]" : "border-slate-200"
        }`}>
          Ranker Bhaiya · Aapki Mehnat, Hamari Strategy.
        </footer>
      </div>
    );
  }

  // ================= MAIN DASHBOARD =================

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        dark
          ? "border-white/[0.07] bg-[#060A16]/90"
          : "border-slate-200 bg-white/90"
      }`}>
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/student/dashboard")}
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition hover:-translate-y-0.5 ${
              dark
                ? "border-white/10 hover:bg-white/5"
                : "border-slate-200 hover:bg-slate-100"
            }`}
          >
            ← Dashboard
          </button>

          <div className="text-center">
            <p className="text-sm font-black">Ranker Bhaiya</p>
            <p className={`text-[10px] ${muted}`}>Hindi Learning Zone</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl text-white shadow-lg">
            📚
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        {/* HERO */}

        <section className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-6 text-white shadow-[0_25px_80px_rgba(79,70,229,0.22)] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="pointer-events-none absolute right-[20%] top-10 text-[150px] font-black text-white/[0.04] lg:text-[220px]">
            अ
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Hindi Learning Zone
              </span>

              <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                हिंदी सीखें
                <span className="mt-2 block text-indigo-200">
                  स्मार्ट तरीके से।
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-8 text-indigo-100 sm:text-base">
                व्याकरण से लेकर प्रतियोगी परीक्षा तक, हिंदी की पूरी तैयारी एक जगह।
                सीखें, अभ्यास करें और अपनी तैयारी को मजबूत बनाएं।
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={() => openModule(modules[0])}
                  className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-indigo-700 shadow-xl transition hover:-translate-y-1"
                >
                  सीखना शुरू करें →
                </button>

                <button
                  onClick={() => openModule(modules[6])}
                  className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                >
                  🔥 Daily Challenge
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-5 text-xs font-bold text-white/70">
                <span>✓ Interactive Lessons</span>
                <span>✓ MCQ Practice</span>
                <span>✓ Daily Learning</span>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto flex h-[300px] w-[300px] rotate-3 items-center justify-center rounded-[48px] border border-white/20 bg-white/[0.08] shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-5 rounded-[36px] border border-white/10" />
                <div className="text-[150px] font-black text-white drop-shadow-xl">
                  अ
                </div>

                <div className="absolute -left-8 top-10 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
                  <span className="text-2xl">📖</span>
                </div>

                <div className="absolute -right-8 bottom-10 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
                  <span className="text-2xl">🎯</span>
                </div>

                <div className="absolute bottom-4 left-8 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-black">Learn · Practice · Grow</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}

        <section className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Learning Modules",
              value: modules.length,
              icon: "📚",
              color: "from-violet-500 to-indigo-500",
            },
            {
              label: "Quiz Attempts",
              value: totalAttempts,
              icon: "🎯",
              color: "from-blue-500 to-cyan-500",
            },
            {
              label: "Completed Modules",
              value: completedModules,
              icon: "🏆",
              color: "from-emerald-500 to-teal-500",
            },
            {
              label: "Available Questions",
              value: totalQuestions,
              icon: "✍️",
              color: "from-orange-500 to-amber-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`group rounded-[24px] border p-5 transition hover:-translate-y-1 hover:shadow-xl sm:p-6 ${panel}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-bold ${muted}`}>
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight">
                    {stat.value}
                  </p>
                </div>

                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-2xl text-white shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* MODULES */}

        <section className="mt-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">
                Your Learning Path
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                अपनी तैयारी चुनें
              </h2>
              <p className={`mt-2 text-sm ${muted}`}>
                अपनी पसंद का module चुनें और अभ्यास शुरू करें।
              </p>
            </div>

            <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${panel}`}>
              <span className="text-indigo-500">{completedModules}</span>
              <span className={muted}> / {modules.length} Modules Completed</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => {
              const attempts = progress[module.id] || 0;

              return (
                <button
                  key={module.id}
                  onClick={() => openModule(module)}
                  className={`group relative overflow-hidden rounded-[28px] border p-5 text-left transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-6 ${
                    dark
                      ? "border-white/[0.07] bg-[#10182B] hover:border-indigo-400/30"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${module.color}`} />

                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-[68px] w-[68px] items-center justify-center rounded-[22px] bg-gradient-to-br ${module.color} text-3xl text-white shadow-xl transition duration-300 group-hover:scale-105`}>
                      {module.icon}
                    </div>

                    <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${
                      dark
                        ? "bg-white/[0.05] text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      MODULE {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-black">
                    {module.title}
                  </h3>

                  <p className="mt-2 text-xs font-bold text-indigo-500">
                    {module.subtitle}
                  </p>

                  <p className={`mt-4 min-h-[60px] text-sm leading-7 ${muted}`}>
                    {module.description}
                  </p>

                  <div className={`mt-5 grid grid-cols-2 gap-3 ${
                    dark ? "border-white/[0.07]" : "border-slate-100"
                  } border-t pt-5`}>
                    <div>
                      <p className={`text-[10px] font-bold ${muted}`}>
                        Lessons
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {module.lessons.length}
                      </p>
                    </div>

                    <div>
                      <p className={`text-[10px] font-bold ${muted}`}>
                        Questions
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {module.questions.length}
                      </p>
                    </div>
                  </div>

                  {attempts > 0 && (
                    <div className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2.5">
                      <p className="text-xs font-bold text-emerald-500">
                        ✓ Quiz attempted {attempts} time(s)
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-500">
                      सीखना शुरू करें
                    </span>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 transition group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white">
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* DAILY CHALLENGE */}

        <section className="mt-10">
          <button
            onClick={() => openModule(modules[6])}
            className="group relative w-full overflow-hidden rounded-[30px] bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-6 text-left text-white shadow-[0_25px_60px_rgba(249,115,22,0.18)] transition hover:-translate-y-1 sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute right-10 top-10 text-8xl text-white/[0.08]">
              🔥
            </div>

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]">
                  Daily Practice
                </span>

                <h2 className="mt-5 text-2xl font-black sm:text-3xl">
                  रोज़ थोड़ा सीखें,
                  <span className="block">आगे बढ़ते रहें।</span>
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
                  रोज़ाना छोटे अभ्यास, नए शब्द और MCQ के साथ अपनी हिंदी की तैयारी मजबूत करें।
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-white/80">
                  <span className="rounded-xl bg-white/10 px-4 py-3">
                    3 Questions
                  </span>
                  <span className="rounded-xl bg-white/10 px-4 py-3">
                    Quick Practice
                  </span>
                  <span className="rounded-xl bg-white/10 px-4 py-3">
                    Daily Learning
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <div className="flex h-16 items-center justify-center rounded-2xl bg-white px-7 text-sm font-black text-orange-600 shadow-xl transition group-hover:scale-105">
                  आज का Challenge →
                </div>
              </div>
            </div>
          </button>
        </section>

        {/* FOOTER */}

        <section className={`mt-10 rounded-[24px] border p-6 text-center ${panel}`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl text-white">
            अ
          </div>

          <h3 className="mt-4 text-lg font-black">
            सीखना जारी रखें
          </h3>

          <p className={`mx-auto mt-2 max-w-xl text-sm leading-7 ${muted}`}>
            नियमित अभ्यास और निरंतर सीखने से अपनी तैयारी को बेहतर बनाएं।
          </p>

          <p className="mt-5 text-xs font-bold text-indigo-500">
            Ranker Bhaiya · Aapki Mehnat, Hamari Strategy.
          </p>
        </section>
      </main>

      <footer className={`border-t px-4 py-8 text-center text-xs ${muted} ${
        dark ? "border-white/[0.07]" : "border-slate-200"
      }`}>
        © Ranker Bhaiya · Hindi Learning Zone
      </footer>
    </div>
  );
}
