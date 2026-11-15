
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
        content:
          "किसी व्यक्ति, वस्तु, स्थान, प्राणी या भाव के नाम को संज्ञा कहते हैं।",
        examples: ["राम — व्यक्तिवाचक संज्ञा", "दिल्ली — स्थान का नाम", "ईमानदारी — भाववाचक संज्ञा"],
      },
      {
        title: "सर्वनाम",
        content:
          "संज्ञा के स्थान पर प्रयोग किए जाने वाले शब्दों को सर्वनाम कहते हैं।",
        examples: ["मैं", "तुम", "वह", "हम", "वे"],
      },
      {
        title: "विशेषण",
        content:
          "जो शब्द संज्ञा या सर्वनाम की विशेषता बताते हैं, उन्हें विशेषण कहते हैं।",
        examples: ["सुंदर फूल", "लंबा पेड़", "मेहनती विद्यार्थी"],
      },
      {
        title: "क्रिया",
        content:
          "जिस शब्द से किसी काम के करने या होने का बोध होता है, उसे क्रिया कहते हैं।",
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
        content:
          "समान या लगभग समान अर्थ बताने वाले शब्द पर्यायवाची कहलाते हैं।",
        examples: ["सूर्य — रवि, भानु, दिनकर", "पृथ्वी — धरती, धरा, वसुंधरा", "जल — नीर, पानी, वारि"],
      },
      {
        title: "विलोम शब्द",
        content: "एक-दूसरे के विपरीत अर्थ वाले शब्द विलोम कहलाते हैं।",
        examples: ["दिन — रात", "लाभ — हानि", "आशा — निराशा"],
      },
      {
        title: "अनेक शब्दों के लिए एक शब्द",
        content:
          "कई शब्दों के स्थान पर प्रयोग होने वाला एक सार्थक शब्द इस श्रेणी में आता है।",
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
        content:
          "दो वर्णों के मेल से होने वाले विकार को संधि कहते हैं। संधि के प्रमुख प्रकार स्वर, व्यंजन और विसर्ग संधि हैं।",
        examples: ["विद्या + आलय = विद्यालय", "महा + ईश = महेश", "सत् + जन = सज्जन"],
      },
      {
        title: "स्वर संधि",
        content:
          "जब दो स्वरों के मेल से परिवर्तन होता है, तो उसे स्वर संधि कहते हैं।",
        examples: ["महा + ईश = महेश", "नर + इंद्र = नरेंद्र"],
      },
      {
        title: "समास",
        content:
          "दो या दो से अधिक शब्दों के मेल से बने संक्षिप्त शब्द को समास कहते हैं।",
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
        content:
          "ऐसा वाक्यांश जिसका अर्थ उसके सामान्य शब्दार्थ से अलग होता है, मुहावरा कहलाता है।",
        examples: ["आँखों का तारा — बहुत प्यारा", "नाक कटना — अपमान होना", "दाँत खट्टे करना — बुरी तरह हराना"],
      },
      {
        title: "लोकोक्तियाँ",
        content:
          "लोक अनुभव पर आधारित प्रचलित कथन, जो किसी सीख या सत्य को व्यक्त करते हैं, लोकोक्ति कहलाते हैं।",
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
        content:
          "शब्दों को भाषा के मानक नियमों के अनुसार सही रूप में लिखना शुद्ध वर्तनी कहलाता है।",
        examples: ["आशीर्वाद", "उज्ज्वल", "कृपया", "स्वास्थ्य", "आवश्यक"],
      },
      {
        title: "सामान्य अशुद्धियाँ",
        content:
          "समान उच्चारण वाले शब्दों में मात्रा और अक्षरों की गलती से वर्तनी अशुद्ध हो सकती है।",
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
        content:
          "प्रत्येक प्रश्न के चार विकल्प होंगे। सही विकल्प चुनने पर आपको तुरंत परिणाम और उत्तर का स्पष्टीकरण मिलेगा।",
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
        content:
          "प्रतिदिन कुछ नए शब्द, एक मुहावरा और व्याकरण का एक नियम दोहराएँ। नियमित अभ्यास से समझ मजबूत होती है।",
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

export default function HindiLearning() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>(readProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const totalCompleted = useMemo(
    () => Object.values(progress).reduce((sum, value) => sum + value, 0),
    [progress],
  );

  const totalQuestions = modules.reduce(
    (sum, module) => sum + module.questions.length,
    0,
  );

  const currentQuestion = selectedModule?.questions[questionIndex];

  const openModule = (module: Module) => {
    setSelectedModule(module);
    setSelectedLesson(0);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  const closeModule = () => {
    setSelectedModule(null);
    setSelectedAnswer(null);
    setQuizFinished(false);
  };

  const startQuiz = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
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

  const pageBg = dark ? "bg-[#050A18] text-white" : "bg-[#F4F7FF] text-slate-900";
  const panel = dark
    ? "border-white/[0.08] bg-[#0C1630]"
    : "border-slate-200 bg-white";

  if (selectedModule) {
    const lesson = selectedModule.lessons[selectedLesson];

    return (
      <div className={`min-h-screen ${pageBg}`}>
        <header className={`sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl ${
          dark ? "border-white/10 bg-[#050A18]/90" : "border-slate-200 bg-white/90"
        }`}>
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              onClick={closeModule}
              className="rounded-xl border border-slate-500/20 px-4 py-2 text-xs font-bold"
            >
              ← वापस जाएँ
            </button>
            <span className="text-xs font-black">Ranker Bhaiya</span>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="rounded-xl bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-500"
            >
              Dashboard
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className={`overflow-hidden rounded-[30px] bg-gradient-to-br ${selectedModule.color} p-6 text-white shadow-xl sm:p-8`}>
            <div className="text-4xl">{selectedModule.icon}</div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
              {selectedModule.subtitle}
            </p>
            <h1 className="mt-2 text-3xl font-black">{selectedModule.title}</h1>
            <p className="mt-2 text-sm text-white/80">{selectedModule.description}</p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
            <aside className={`h-fit rounded-[24px] border p-4 ${panel}`}>
              <h2 className="mb-3 text-sm font-black">पाठ चुनें</h2>
              <div className="space-y-2">
                {selectedModule.lessons.map((item, index) => (
                  <button
                    key={item.title}
                    onClick={() => setSelectedLesson(index)}
                    className={`w-full rounded-xl px-3 py-3 text-left text-xs font-bold transition ${
                      selectedLesson === index
                        ? "bg-indigo-600 text-white"
                        : dark
                          ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}. {item.title}
                  </button>
                ))}
                <button
                  onClick={startQuiz}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-3 text-left text-xs font-black text-white"
                >
                  🎯 अभ्यास Quiz शुरू करें
                </button>
              </div>
            </aside>

            <section className={`rounded-[24px] border p-5 sm:p-7 ${panel}`}>
              {!quizFinished && !currentQuestion && (
                <p className="text-sm text-slate-500">इस मॉड्यूल में अभी प्रश्न उपलब्ध नहीं हैं।</p>
              )}

              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black text-indigo-500">
                  LESSON {selectedLesson + 1}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {selectedLesson + 1}/{selectedModule.lessons.length}
                </span>
              </div>

              <h2 className="text-2xl font-black">{lesson.title}</h2>
              <p className="mt-4 text-sm leading-8 text-slate-500">{lesson.content}</p>

              <div className={`mt-6 rounded-2xl p-5 ${
                dark ? "bg-white/[0.04]" : "bg-indigo-50"
              }`}>
                <h3 className="text-sm font-black text-indigo-500">उदाहरण</h3>
                <ul className="mt-3 space-y-3">
                  {lesson.examples.map((example) => (
                    <li key={example} className="flex gap-3 text-sm">
                      <span className="font-black text-emerald-500">✓</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button
                  disabled={selectedLesson === 0}
                  onClick={() => setSelectedLesson((value) => value - 1)}
                  className="rounded-xl border border-slate-500/20 px-5 py-3 text-xs font-bold disabled:opacity-30"
                >
                  ← पिछला पाठ
                </button>
                <button
                  disabled={selectedLesson === selectedModule.lessons.length - 1}
                  onClick={() => setSelectedLesson((value) => value + 1)}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white disabled:opacity-30"
                >
                  अगला पाठ →
                </button>
              </div>

              <div className={`mt-8 border-t pt-6 ${
                dark ? "border-white/10" : "border-slate-200"
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">अपनी तैयारी जाँचें</p>
                    <p className="mt-1 text-xs text-slate-500">
                      इस मॉड्यूल के प्रश्न हल करके अभ्यास करें।
                    </p>
                  </div>
                  <button
                    onClick={startQuiz}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-black text-white"
                  >
                    Start Quiz →
                  </button>
                </div>
              </div>
            </section>
          </div>

          {currentQuestion && (
            <section className={`mt-6 rounded-[26px] border p-5 sm:p-7 ${panel}`}>
              {!quizFinished ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                      Practice Quiz
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      प्रश्न {questionIndex + 1}/{selectedModule.questions.length}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-500/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{
                        width: `${((questionIndex + 1) / selectedModule.questions.length) * 100}%`,
                      }}
                    />
                  </div>

                  <h2 className="mt-6 text-lg font-black leading-8">
                    {currentQuestion.question}
                  </h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                          <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/10 text-xs">
                            {String.fromCharCode(65 + index)}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswer !== null && (
                    <div className={`mt-5 rounded-2xl p-4 ${
                      selectedAnswer === currentQuestion.answer
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}>
                      <p className="text-sm font-black">
                        {selectedAnswer === currentQuestion.answer
                          ? "✓ बिल्कुल सही!"
                          : "✕ सही उत्तर: " + currentQuestion.options[currentQuestion.answer]}
                      </p>
                      <p className="mt-2 text-xs leading-6">{currentQuestion.explanation}</p>
                      <button
                        onClick={nextQuestion}
                        className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white"
                      >
                        {questionIndex === selectedModule.questions.length - 1
                          ? "परिणाम देखें"
                          : "अगला प्रश्न →"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-5 text-center">
                  <div className="text-5xl">🏆</div>
                  <h2 className="mt-4 text-2xl font-black">Quiz पूरा हुआ!</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    आपने {selectedModule.questions.length} प्रश्नों का अभ्यास पूरा किया।
                  </p>
                  <p className="mt-5 text-4xl font-black text-indigo-500">
                    {score}/{selectedModule.questions.length * 10}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">आपका स्कोर</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={startQuiz}
                      className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white"
                    >
                      फिर से प्रयास करें
                    </button>
                    <button
                      onClick={closeModule}
                      className="rounded-xl border border-slate-500/20 px-5 py-3 text-xs font-bold"
                    >
                      सभी Modules देखें
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>

        <footer className="px-4 py-8 text-center text-[10px] font-semibold text-slate-500">
          Ranker Bhaiya · Aapki Mehnat, Hamari Strategy.
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <header className={`sticky top-0 z-30 border-b px-4 py-4 backdrop-blur-xl ${
        dark ? "border-white/10 bg-[#050A18]/90" : "border-slate-200 bg-white/90"
      }`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="rounded-xl border border-slate-500/20 px-4 py-2 text-xs font-bold"
          >
            ← Dashboard
          </button>
          <span className="text-xs font-black">Ranker Bhaiya</span>
          <span className="text-xl">📚</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <section className="relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-6 text-white shadow-[0_24px_70px_rgba(79,70,229,0.25)] sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_260px] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em]">
                ✨ Hindi Learning Zone
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                हिंदी सीखें
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                व्याकरण से लेकर प्रतियोगी परीक्षा तक, हिंदी की पूरी तैयारी एक जगह।
              </p>
              <button
                onClick={() => openModule(modules[0])}
                className="mt-6 rounded-xl bg-white px-5 py-3 text-xs font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5"
              >
                सीखना शुरू करें →
              </button>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <div className="flex h-52 w-52 rotate-3 items-center justify-center rounded-[42px] border border-white/20 bg-white/10 text-8xl shadow-2xl backdrop-blur">
                अ
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <p className="text-[10px] font-bold text-slate-500">कुल Modules</p>
            <p className="mt-2 text-2xl font-black">{modules.length}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <p className="text-[10px] font-bold text-slate-500">Quiz Attempts</p>
            <p className="mt-2 text-2xl font-black">{totalCompleted}</p>
          </div>
          <div className={`col-span-2 rounded-2xl border p-4 sm:col-span-1 ${panel}`}>
            <p className="text-[10px] font-bold text-slate-500">उपलब्ध प्रश्न</p>
            <p className="mt-2 text-2xl font-black">{totalQuestions}</p>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
              Your Learning Path
            </p>
            <h2 className="mt-2 text-2xl font-black">अपनी तैयारी चुनें</h2>
            <p className="mt-2 text-xs text-slate-500">
              किसी भी module को खोलें और सीखना शुरू करें।
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => openModule(module)}
                className={`group relative overflow-hidden rounded-[25px] border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  dark
                    ? "border-white/[0.08] bg-[#0C1630] hover:border-indigo-400/40"
                    : "border-slate-200 bg-white hover:border-indigo-300"
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${module.color}`} />
                <div className="flex items-start justify-between">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${module.color} text-2xl text-white shadow-lg`}>
                    {module.icon}
                  </span>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[9px] font-black text-indigo-500">
                    MODULE {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-black">{module.title}</h3>
                <p className="mt-1 text-[10px] font-bold text-indigo-500">
                  {module.subtitle}
                </p>
                <p className="mt-3 min-h-10 text-xs leading-6 text-slate-500">
                  {module.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-500/10 pt-4">
                  <span className="text-[10px] font-black text-indigo-500">
                    {module.lessons.length} Lessons · {module.questions.length} Questions
                  </span>
                  <span className="text-sm transition-transform group-hover:translate-x-1">→</span>
                </div>

                {progress[module.id] > 0 && (
                  <p className="mt-3 text-[10px] font-bold text-emerald-500">
                    ✓ Quiz completed {progress[module.id]} time(s)
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-9 rounded-[26px] border border-indigo-500/15 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                Daily Practice
              </p>
              <h2 className="mt-2 text-lg font-black">रोज़ थोड़ा सीखें, आगे बढ़ते रहें।</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                नियमित अभ्यास से शब्द ज्ञान और व्याकरण की समझ मजबूत करें।
              </p>
            </div>
            <button
              onClick={() => openModule(modules[6])}
              className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white"
            >
              आज का Challenge →
            </button>
          </div>
        </section>
      </main>

      <footer className="px-4 py-8 text-center text-[10px] font-semibold text-slate-500">
        Ranker Bhaiya · Aapki Mehnat, Hamari Strategy.
      </footer>
    </div>
  );
}
