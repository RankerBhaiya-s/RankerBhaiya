import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const STORAGE_KEY = "ranker-bhaiya-language";

const resources = {
  en: {
    translation: {
      common: {
        student: "Student",
        admin: "Admin",
        logout: "Logout",
        premium: "Premium",
        free: "Free",
        external: "External",
        comingSoon: "Coming Soon",
        notSet: "Not set",
        back: "Back",
        loading: "Loading...",
        search: "Search",
        retry: "Retry",
        readMore: "Read More",
        viewAll: "View All",
        next: "Next",
        previous: "Previous",
        submit: "Submit",
        score: "Score",
        answer: "Answer",
        explanation: "Explanation",
      },

      language: {
        english: "English",
        hindi: "हिंदी",
        hinglish: "Hinglish",
      },

      home: {
        heroTitle: "Learn smarter. Prepare better.",
        heroSubtitle:
          "Ranker Bhaiya brings learning resources, current affairs, and AI-powered guidance together in one place — helping you learn smarter, stay ahead, and prepare with confidence.",
        ctaStudent: "Student Login",

        pillars: {
          syllabus:
            "Follow your syllabus with focused and structured learning.",
          ai:
            "Ask Vidhya whenever you need help understanding a topic.",
          video:
            "Access useful learning content and educational resources.",
          progress:
            "Stay consistent and make steady progress in your preparation.",
        },
      },

      studentLogin: {
        login: "Student Login",
        loginSubtitle: "Login to continue your learning journey.",
        createSubtitle: "Create your student account to start learning.",
        fullName: "Full Name",
        fullNamePlaceholder: "Enter your full name",
        createAccountButton: "Create Account",
        alreadyAccount: "Already have an account?",
        secureAuthentication: "Secure student authentication",
        email: "Email",
        password: "Password",
        loginButton: "Login",
        noAccount: "Don't have an account?",
        createAccount: "Create Account",
        emailPlaceholder: "Enter your email",
        passwordPlaceholder: "Enter your password",
        loginError: "Unable to login. Please try again.",
      },

      dashboard: {
        brandTagline: "Your learning dashboard",

        subtitle: "Your learning dashboard",
        welcome: "Welcome",

        class: "Class",
        board: "Board",
        exam: "Exam",

        openMenu: "Open menu",
        editProfile: "Edit Profile",

        mindset: {
          label: "TODAY'S MINDSET",
          quote:
            "Small progress every day becomes big success over time.",
          subtitle:
            "Keep learning. Keep revising. Keep moving forward.",
        },

        welcomeBack: "Welcome back",

        welcomeDescription:
          "Your learning space is ready. Revise faster, stay updated with current affairs and use AI to learn smarter.",

        fastRevisionButton: "Fast Revision",

        menu: {
          syllabus: "Syllabus",
          syllabusDesc: "View your subjects and syllabus",

          profile: "Profile",
          profileDesc: "View and update your profile",

          lightMode: "Light Mode",
          darkMode: "Dark Mode",
          changeAppearance: "Change appearance",

          settings: "Settings",
          comingSoon: "Coming soon",
        },

        fastRevision: {
          title: "Fast Revision",
          sectionTitle: "Fast Revision",
          sectionDescription:
            "Revise important topics quickly and test your preparation.",

          badge: "SMART PRACTICE",

          description:
            "Pick a subject or topic and start a quick revision session. Practice questions, identify weak areas and improve every day.",

          smartQuestions: "Smart Questions",
          topicWise: "Topic Wise",
          quickPractice: "Quick Practice",

          action: "Start Revision",
        },

        currentAffairs: {
          sectionTitle: "Daily Current Affairs",
          sectionDescription:
            "Stay updated with the latest events that matter for your exams.",

          title: "Daily Current Affairs",

          description:
            "Read important current affairs, understand what happened and prepare with exam-focused information.",

          action: "Read Today's Current Affairs →",
          badge: "FREE",
        },

        newspaper: {
          sectionTitle: "Daily Newspaper",
          sectionDescription:
            "Read the latest newspaper updates and stay informed every day.",

          title: "Daily Newspaper",

          description:
            "Read daily newspaper updates in a simple, student-friendly format and stay connected with important national and international news.",

          action: "Read Today's Newspaper →",
          badge: "DAILY",
        },

        news: {
          sectionTitle: "What's in News",
          sectionDescription:
            "Know not just what happened, but why it matters.",

          whatsInNews: {
            title: "What's in News",
            description:
              "Get a quick and simple understanding of important events, developments and issues making headlines.",
            action: "Explore News →",
            badge: "LATEST",
          },

          whyImportant: {
            title: "Why Important?",
            description:
              "Understand why a news event is important for exams, society, economy, government and the country.",
            action: "Understand Why →",
            badge: "EXAM FOCUS",
          },
        },

        askVidhya: {
          sectionTitle: "Ask Vidhya",
          sectionDescription:
            "Stuck on a concept? Ask, understand and learn.",

          badge: "AI LEARNING ASSISTANT",

          title: "Ask Vidhya",

          description:
            "Ask questions in your own words and get clear, student-friendly explanations to understand difficult concepts faster.",

          askAnything: "Ask Anything",
          easyExplanations: "Easy Explanations",
          studyHelp: "Study Help",

          action: "Ask Vidhya",
        },

        vocabulary: {
          sectionTitle: "English Vocabulary",
          sectionDescription:
            "Build stronger vocabulary and improve your English every day.",

          title: "Learn English with Vocab-Bhaiya",

          description:
            "Improve your vocabulary, learn useful words and strengthen your English skills through interactive learning.",

          action: "Start Learning →",
          badge: "EXTERNAL",
        },

        videos: {
          sectionTitle: "Video Learning",
          sectionDescription:
            "Video-based learning experiences are coming soon.",

          title: "Video Classes",

          description:
            "Learn through engaging video lessons designed to make difficult concepts easier to understand.",

          action: "Coming Soon",
          badge: "COMING SOON",
        },

        about: {
          eyebrow: "ABOUT",
          title: "About RANKER BHAIYA",

          description:
            "Ranker Bhaiya is a focused learning platform built to help students prepare smarter, stay updated, and make consistent progress. From daily current affairs and newspaper reading to fast revision, vocabulary building, and AI-powered learning support, everything is thoughtfully designed to make exam preparation simpler, more effective, and more engaging.",

          examFocused: "Exam Focused",
          aiPowered: "AI Powered",
          studentFriendly: "Student Friendly",
        },

        footer: {
          tagline: "Learn smarter. Grow faster.",
        },
      },

      currentAffairs: {
        label: "Current Affairs",
        title: "Daily Current Affairs",
        subtitle:
          "Important events and updates curated for your exam preparation.",

        searchPlaceholder: "Search current affairs...",
        loading: "Loading current affairs...",
        loadError:
          "Unable to load current affairs. Please try again.",

        allCategories: "All Categories",
        mixedTitle: "Latest Current Affairs",
        topics: "topics",

        mcqs: "MCQs",
        readMore: "Read More",

        emptyTitle: "No current affairs found",
        emptyDescription:
          "Try changing your search or category filter.",

        categories: {
          All: "All",
          National: "National",
          International: "International",
          "Science & Tech": "Science & Tech",
          Economy: "Economy",
          Sports: "Sports",
          Awards: "Awards",
        },

        categoryTitles: {
          national: "National Updates",
          international: "International Affairs",
          scienceTech: "Science & Technology",
          economy: "Economy & Business",
          sports: "Sports",
          awards: "Awards & Appointments",
        },

        categoryDescriptions: {
          national:
            "Important national events and government-related developments.",
          international:
            "Major international events, global developments and important world news.",
          scienceTech:
            "Important developments in science, technology, space and innovation.",
          economy:
            "Key economic developments, business news and important financial updates.",
          sports:
            "Important sports events, tournaments, achievements and major victories.",
          awards:
            "Important appointments, awards, honours and personalities in the news.",
        },

        detail: {
          back: "Back to Current Affairs",
          whyInNews: "Why in News?",
          keyFacts: "Key Facts",
          examPoint: "Exam Point",
          staticGK: "Static GK",
          mcqs: "Practice MCQs",
          noMcqs: "No MCQs available for this topic.",
          loading: "Loading current affair...",
          notFound: "Current affair not found.",
        },
      },

      fastRevision: {
        title: "Fast Revision",
        subtitle:
          "Revise important topics quickly with AI-powered revision cards and quizzes.",
        subject: "Subject",
        topic: "Topic",
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        generate: "Generate Revision",
        generating: "Generating...",
        cards: "Revision Cards",
        quiz: "Quiz",
        next: "Next",
        previous: "Previous",
        submit: "Submit",
        score: "Your Score",
        tryAgain: "Try Again",
      },

      askVidhya: {
        title: "Ask Vidhya",
        subtitle:
          "Ask questions and get help with your studies.",
        placeholder: "Ask Vidhya anything...",
        thinking: "Vidhya is thinking...",
        send: "Send",
        newChat: "New Chat",
        history: "Chat History",
        noHistory: "No previous chats.",
        unableToConnect:
          "Unable to connect with Vidhya. Please try again.",
      },

      newspaper: {
        title: "Daily Newspaper",
        subtitle:
          "Read daily newspaper updates in a simple, student-friendly format.",
        loading: "Loading newspaper...",
        error:
          "Unable to load newspaper. Please try again.",
        noNews: "No newspaper available.",
        read: "Read Newspaper",
      },

      vocabulary: {
        title: "English Vocabulary",
        subtitle:
          "Improve your English vocabulary with useful words and meanings.",
        open: "Open Vocabulary",
      },

      videos: {
        title: "Learning Videos",
        subtitle:
          "Useful educational videos and learning resources.",
        comingSoon: "Video Learning Coming Soon",
      },

      about: {
        title: "About RANKER BHAIYA",
        description:
          "Ranker Bhaiya is a student-focused learning platform designed to make exam preparation simpler, smarter and more effective.",
      },

      notFound: {
        title: "Page Not Found",
        body:
          "The page you are looking for does not exist or may have been moved.",
        cta: "Go Home",
      },
    },
  },

  hi: {
    translation: {
      common: {
        student: "विद्यार्थी",
        admin: "एडमिन",
        logout: "लॉग आउट",
        premium: "प्रीमियम",
        free: "फ्री",
        external: "बाहरी",
        comingSoon: "जल्द आ रहा है",
        notSet: "सेट नहीं है",
        back: "वापस",
        loading: "लोड हो रहा है...",
        search: "खोजें",
        retry: "फिर से प्रयास करें",
        readMore: "और पढ़ें",
        viewAll: "सभी देखें",
        next: "अगला",
        previous: "पिछला",
        submit: "जमा करें",
        score: "स्कोर",
        answer: "उत्तर",
        explanation: "व्याख्या",
      },

      language: {
        english: "English",
        hindi: "हिंदी",
        hinglish: "Hinglish",
      },

      home: {
        heroTitle: "स्मार्ट तरीके से पढ़ें। बेहतर तैयारी करें।",
        heroSubtitle:
          "Ranker Bhaiya आपके लिए पढ़ाई के संसाधन, करंट अफेयर्स और AI आधारित सहायता एक ही जगह लाता है।",
        ctaStudent: "स्टूडेंट लॉगिन",

        pillars: {
          syllabus:
            "अपने सिलेबस के अनुसार व्यवस्थित और केंद्रित पढ़ाई करें।",
          ai:
            "किसी भी विषय को समझने में मदद के लिए विध्या से पूछें।",
          video:
            "उपयोगी शैक्षणिक सामग्री और लर्निंग रिसोर्स प्राप्त करें।",
          progress:
            "नियमित पढ़ाई करें और अपनी तैयारी में लगातार प्रगति करें।",
        },
      },

      studentLogin: {
        login: "स्टूडेंट लॉगिन",
        loginSubtitle:
          "अपनी पढ़ाई जारी रखने के लिए लॉगिन करें।",
        createSubtitle: "पढ़ाई शुरू करने के लिए अपना स्टूडेंट अकाउंट बनाएं।",
        fullName: "पूरा नाम",
        fullNamePlaceholder: "अपना पूरा नाम दर्ज करें",
        createAccountButton: "अकाउंट बनाएं",
        alreadyAccount: "पहले से अकाउंट है?",
        secureAuthentication: "सुरक्षित स्टूडेंट ऑथेंटिकेशन",
        email: "ईमेल",
        password: "पासवर्ड",
        loginButton: "लॉगिन करें",
        noAccount: "अकाउंट नहीं है?",
        createAccount: "अकाउंट बनाएं",
        emailPlaceholder: "अपना ईमेल दर्ज करें",
        passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
        loginError:
          "लॉगिन नहीं हो सका। कृपया दोबारा प्रयास करें।",
      },

      dashboard: {
        brandTagline: "आपका लर्निंग डैशबोर्ड",

        subtitle: "आपका लर्निंग डैशबोर्ड",
        welcome: "स्वागत है",

        class: "कक्षा",
        board: "बोर्ड",
        exam: "परीक्षा",

        openMenu: "मेनू खोलें",
        editProfile: "प्रोफाइल एडिट करें",

        mindset: {
          label: "आज की सोच",
          quote:
            "हर दिन की छोटी प्रगति समय के साथ बड़ी सफलता बन जाती है।",
          subtitle:
            "सीखते रहें। रिवीजन करते रहें। आगे बढ़ते रहें।",
        },

        welcomeBack: "वापसी पर स्वागत है",

        welcomeDescription:
          "आपका लर्निंग स्पेस तैयार है। तेज़ी से रिवीजन करें, करंट अफेयर्स से अपडेट रहें और स्मार्ट तरीके से पढ़ने के लिए AI का उपयोग करें।",

        fastRevisionButton: "फास्ट रिवीजन",

        menu: {
          syllabus: "सिलेबस",
          syllabusDesc: "अपने विषय और सिलेबस देखें",

          profile: "प्रोफाइल",
          profileDesc: "अपनी प्रोफाइल देखें और अपडेट करें",

          lightMode: "लाइट मोड",
          darkMode: "डार्क मोड",
          changeAppearance: "थीम बदलें",

          settings: "सेटिंग्स",
          comingSoon: "जल्द आ रहा है",
        },

        fastRevision: {
          title: "फास्ट रिवीजन",
          sectionTitle: "फास्ट रिवीजन",
          sectionDescription:
            "महत्वपूर्ण विषयों का जल्दी रिवीजन करें और अपनी तैयारी को टेस्ट करें।",

          badge: "स्मार्ट प्रैक्टिस",

          description:
            "कोई विषय या टॉपिक चुनें और क्विक रिवीजन सेशन शुरू करें। प्रश्नों की प्रैक्टिस करें, कमजोर क्षेत्रों को पहचानें और हर दिन बेहतर बनें।",

          smartQuestions: "स्मार्ट प्रश्न",
          topicWise: "टॉपिक वाइज",
          quickPractice: "क्विक प्रैक्टिस",

          action: "रिवीजन शुरू करें",
        },

        currentAffairs: {
          sectionTitle: "दैनिक करेंट अफेयर्स",
          sectionDescription:
            "अपने एग्जाम के लिए महत्वपूर्ण नवीनतम घटनाओं से अपडेट रहें।",

          title: "दैनिक करेंट अफेयर्स",

          description:
            "महत्वपूर्ण करेंट अफेयर्स पढ़ें, समझें कि क्या हुआ और परीक्षा-केंद्रित जानकारी के साथ तैयारी करें।",

          action: "आज के करेंट अफेयर्स पढ़ें →",
          badge: "फ्री",
        },

        newspaper: {
          sectionTitle: "डेली न्यूज़पेपर",
          sectionDescription:
            "नवीनतम न्यूज़पेपर अपडेट पढ़ें और हर दिन जानकारी से जुड़े रहें।",

          title: "डेली न्यूज़पेपर",

          description:
            "सरल और छात्र-अनुकूल तरीके से रोज़ के न्यूज़पेपर अपडेट पढ़ें और महत्वपूर्ण राष्ट्रीय व अंतरराष्ट्रीय खबरों से जुड़े रहें।",

          action: "आज का न्यूज़पेपर पढ़ें →",
          badge: "डेली",
        },

        news: {
          sectionTitle: "खबरों में क्या है",
          sectionDescription:
            "सिर्फ क्या हुआ नहीं, बल्कि यह क्यों महत्वपूर्ण है, यह भी जानें।",

          whatsInNews: {
            title: "खबरों में क्या है",
            description:
              "महत्वपूर्ण घटनाओं, विकास और सुर्खियों में रहने वाले मुद्दों को जल्दी और आसान तरीके से समझें।",
            action: "खबरें देखें →",
            badge: "नवीनतम",
          },

          whyImportant: {
            title: "क्यों महत्वपूर्ण है?",
            description:
              "समझें कि कोई खबर परीक्षा, समाज, अर्थव्यवस्था, सरकार और देश के लिए क्यों महत्वपूर्ण है।",
            action: "क्यों समझें →",
            badge: "परीक्षा फोकस",
          },
        },

        askVidhya: {
          sectionTitle: "विध्या से पूछें",
          sectionDescription:
            "किसी कॉन्सेप्ट में अटक गए? पूछें, समझें और सीखें।",

          badge: "AI लर्निंग असिस्टेंट",

          title: "विध्या से पूछें",

          description:
            "अपने शब्दों में सवाल पूछें और कठिन कॉन्सेप्ट को जल्दी समझने के लिए आसान और छात्र-अनुकूल जवाब पाएं।",

          askAnything: "कुछ भी पूछें",
          easyExplanations: "आसान समझ",
          studyHelp: "स्टडी हेल्प",

          action: "विध्या से पूछें",
        },

        vocabulary: {
          sectionTitle: "अंग्रेज़ी शब्दावली",
          sectionDescription:
            "अपनी शब्दावली मजबूत करें और हर दिन अपनी अंग्रेज़ी बेहतर करें।",

          title: "Vocab-Bhaiya से अंग्रेज़ी सीखें",

          description:
            "अपनी शब्दावली बेहतर करें, उपयोगी शब्द सीखें और इंटरैक्टिव लर्निंग के जरिए अंग्रेज़ी मजबूत करें।",

          action: "सीखना शुरू करें →",
          badge: "बाहरी",
        },

        videos: {
          sectionTitle: "वीडियो लर्निंग",
          sectionDescription:
            "वीडियो आधारित लर्निंग अनुभव जल्द आ रहे हैं।",

          title: "वीडियो क्लासेस",

          description:
            "ऐसे वीडियो लेसन से सीखें जो कठिन कॉन्सेप्ट को आसान तरीके से समझने में मदद करें।",

          action: "जल्द आ रहा है",
          badge: "जल्द आ रहा है",
        },

        about: {
          eyebrow: "परिचय",
          title: "RANKER BHAIYA के बारे में",

          description:
            "Ranker Bhaiya को परीक्षा की तैयारी को आसान, स्मार्ट और अधिक केंद्रित बनाने के लिए बनाया गया है। डेली करंट अफेयर्स और न्यूज़पेपर से लेकर फास्ट रिवीजन, AI लर्निंग और वोकैबुलरी तक, हर सुविधा छात्रों को लगातार सीखने और बेहतर तैयारी करने में मदद करने के लिए बनाई गई है।",

          examFocused: "परीक्षा केंद्रित",
          aiPowered: "AI आधारित",
          studentFriendly: "छात्र अनुकूल",
        },

        footer: {
          tagline: "स्मार्ट तरीके से सीखें। तेजी से आगे बढ़ें।",
        },
      },

      currentAffairs: {
        label: "करंट अफेयर्स",
        title: "दैनिक करेंट अफेयर्स",
        subtitle:
          "आपकी परीक्षा की तैयारी के लिए महत्वपूर्ण घटनाएं और अपडेट।",

        searchPlaceholder: "करंट अफेयर्स खोजें...",
        loading: "करंट अफेयर्स लोड हो रहे हैं...",
        loadError:
          "करंट अफेयर्स लोड नहीं हो सके। कृपया दोबारा प्रयास करें।",

        allCategories: "सभी श्रेणियां",
        mixedTitle: "नवीनतम करंट अफेयर्स",
        topics: "टॉपिक्स",

        mcqs: "MCQs",
        readMore: "और पढ़ें",

        emptyTitle: "कोई करंट अफेयर नहीं मिला",
        emptyDescription:
          "अपनी खोज या कैटेगरी फ़िल्टर बदलकर देखें।",

        categories: {
          All: "सभी",
          National: "राष्ट्रीय",
          International: "अंतरराष्ट्रीय",
          "Science & Tech": "विज्ञान और टेक्नोलॉजी",
          Economy: "अर्थव्यवस्था",
          Sports: "खेल",
          Awards: "पुरस्कार",
        },

        categoryTitles: {
          national: "राष्ट्रीय अपडेट",
          international: "अंतरराष्ट्रीय मामले",
          scienceTech: "विज्ञान और टेक्नोलॉजी",
          economy: "अर्थव्यवस्था और व्यापार",
          sports: "खेल",
          awards: "पुरस्कार और नियुक्तियां",
        },

        categoryDescriptions: {
          national:
            "महत्वपूर्ण राष्ट्रीय घटनाएं और सरकार से जुड़े प्रमुख विकास।",
          international:
            "प्रमुख अंतरराष्ट्रीय घटनाएं, वैश्विक विकास और महत्वपूर्ण विश्व समाचार।",
          scienceTech:
            "विज्ञान, तकनीक, अंतरिक्ष और नवाचार से जुड़े महत्वपूर्ण विकास।",
          economy:
            "प्रमुख आर्थिक विकास, व्यापारिक समाचार और महत्वपूर्ण वित्तीय अपडेट।",
          sports:
            "महत्वपूर्ण खेल आयोजन, टूर्नामेंट, उपलब्धियां और बड़ी जीत।",
          awards:
            "महत्वपूर्ण नियुक्तियां, पुरस्कार, सम्मान और समाचारों में रहने वाली प्रमुख हस्तियां।",
        },

        detail: {
          back: "करंट अफेयर्स पर वापस जाएं",
          whyInNews: "खबरों में क्यों?",
          keyFacts: "मुख्य तथ्य",
          examPoint: "परीक्षा के लिए महत्वपूर्ण",
          staticGK: "स्टैटिक GK",
          mcqs: "अभ्यास MCQs",
          noMcqs:
            "इस विषय के लिए कोई MCQ उपलब्ध नहीं है।",
          loading: "करंट अफेयर लोड हो रहा है...",
          notFound: "करंट अफेयर नहीं मिला।",
        },
      },

      fastRevision: {
        title: "फास्ट रिवीजन",
        subtitle:
          "AI की मदद से महत्वपूर्ण विषयों का जल्दी रिवीजन करें।",
        subject: "विषय",
        topic: "टॉपिक",
        difficulty: "कठिनाई",
        easy: "आसान",
        medium: "मध्यम",
        hard: "कठिन",
        generate: "रिवीजन तैयार करें",
        generating: "तैयार हो रहा है...",
        cards: "रिवीजन कार्ड्स",
        quiz: "क्विज़",
        next: "अगला",
        previous: "पिछला",
        submit: "जमा करें",
        score: "आपका स्कोर",
        tryAgain: "फिर से प्रयास करें",
      },

      askVidhya: {
        title: "विध्या से पूछें",
        subtitle:
          "अपने सवाल पूछें और पढ़ाई में सहायता प्राप्त करें।",
        placeholder: "विध्या से कुछ भी पूछें...",
        thinking: "विध्या सोच रही है...",
        send: "भेजें",
        newChat: "नई चैट",
        history: "चैट हिस्ट्री",
        noHistory: "कोई पुरानी चैट नहीं है।",
        unableToConnect:
          "विध्या से कनेक्ट नहीं हो पाया। कृपया दोबारा प्रयास करें।",
      },

      newspaper: {
        title: "डेली न्यूज़पेपर",
        subtitle:
          "सरल और छात्र-अनुकूल तरीके से रोज़ के समाचार पढ़ें।",
        loading: "न्यूज़पेपर लोड हो रहा है...",
        error:
          "न्यूज़पेपर लोड नहीं हो सका। कृपया दोबारा प्रयास करें।",
        noNews: "कोई न्यूज़पेपर उपलब्ध नहीं है।",
        read: "न्यूज़पेपर पढ़ें",
      },

      vocabulary: {
        title: "अंग्रेज़ी शब्दावली",
        subtitle:
          "उपयोगी शब्दों और उनके अर्थों से अपनी अंग्रेज़ी शब्दावली बेहतर करें।",
        open: "वोकैबुलरी खोलें",
      },

      videos: {
        title: "लर्निंग वीडियो",
        subtitle:
          "उपयोगी शैक्षणिक वीडियो और लर्निंग रिसोर्स।",
        comingSoon: "वीडियो लर्निंग जल्द आ रही है",
      },

      about: {
        title: "RANKER BHAIYA के बारे में",
        description:
          "Ranker Bhaiya एक छात्र-केंद्रित लर्निंग प्लेटफॉर्म है जो परीक्षा की तैयारी को आसान, स्मार्ट और प्रभावी बनाने के लिए बनाया गया है।",
      },

      notFound: {
        title: "पेज नहीं मिला",
        body:
          "आप जिस पेज को खोज रहे हैं वह मौजूद नहीं है या स्थानांतरित हो गया है।",
        cta: "होम पर जाएं",
      },
    },
  },

  hinglish: {
    translation: {
      common: {
        student: "Student",
        admin: "Admin",
        logout: "Logout",
        premium: "Premium",
        free: "Free",
        external: "External",
        comingSoon: "Jaldi aa raha hai",
        notSet: "Set nahi hai",
        back: "Back",
        loading: "Loading...",
        search: "Search",
        retry: "Dobara try karo",
        readMore: "Aur Padho",
        viewAll: "Sabhi Dekho",
        next: "Next",
        previous: "Previous",
        submit: "Submit",
        score: "Score",
        answer: "Answer",
        explanation: "Explanation",
      },

      language: {
        english: "English",
        hindi: "हिंदी",
        hinglish: "Hinglish",
      },

      home: {
        heroTitle:
          "Smart tareeke se padho. Better preparation karo.",
        heroSubtitle:
          "Ranker Bhaiya mein learning resources, current affairs aur AI-powered guidance ek hi jagah milta hai — taaki tum smart tareeke se padho, updated raho aur confidence ke saath preparation karo.",
        ctaStudent: "Student Login",

        pillars: {
          syllabus:
            "Apne syllabus ke according focused aur structured study karo.",
          ai:
            "Jab bhi kisi topic mein help chahiye ho, Vidhya se pucho.",
          video:
            "Useful educational content aur learning resources access karo.",
          progress:
            "Regular study karo aur preparation mein progress banao.",
        },
      },

      studentLogin: {
        login: "Student Login",
        loginSubtitle:
          "Apni learning journey continue karne ke liye login karo.",
        createSubtitle: "Learning start karne ke liye apna student account banao.",
        fullName: "Full Name",
        fullNamePlaceholder: "Apna full name enter karo",
        createAccountButton: "Create Account",
        alreadyAccount: "Pehle se account hai?",
        secureAuthentication: "Secure student authentication",
        email: "Email",
        password: "Password",
        loginButton: "Login",
        noAccount: "Account nahi hai?",
        createAccount: "Account Banao",
        emailPlaceholder: "Apna email enter karo",
        passwordPlaceholder: "Apna password enter karo",
        loginError:
          "Login nahi ho paya. Please dobara try karo.",
      },

      dashboard: {
        brandTagline: "Tumhara learning dashboard",

        subtitle: "Tumhara learning dashboard",
        welcome: "Welcome",

        class: "Class",
        board: "Board",
        exam: "Exam",

        openMenu: "Menu kholo",
        editProfile: "Profile Edit Karo",

        mindset: {
          label: "AAJ KA MINDSET",
          quote:
            "Har din ki chhoti progress time ke saath badi success ban jaati hai.",
          subtitle:
            "Learning karte raho. Revision karte raho. Aage badhte raho.",
        },

        welcomeBack: "Welcome back",

        welcomeDescription:
          "Tumhara learning space ready hai. Fast revision karo, current affairs se updated raho aur AI ki help se smart study karo.",

        fastRevisionButton: "Fast Revision",

        menu: {
          syllabus: "Syllabus",
          syllabusDesc:
            "Apne subjects aur syllabus dekho",

          profile: "Profile",
          profileDesc:
            "Apni profile dekho aur update karo",

          lightMode: "Light Mode",
          darkMode: "Dark Mode",
          changeAppearance: "Appearance change karo",

          settings: "Settings",
          comingSoon: "Jaldi aa raha hai",
        },

        fastRevision: {
          title: "Fast Revision",
          sectionTitle: "Fast Revision",
          sectionDescription:
            "Important topics ko quickly revise karo aur apni preparation test karo.",

          badge: "SMART PRACTICE",

          description:
            "Subject ya topic choose karo aur quick revision session start karo. Questions practice karo, weak areas identify karo aur har din improve karo.",

          smartQuestions: "Smart Questions",
          topicWise: "Topic Wise",
          quickPractice: "Quick Practice",

          action: "Revision Start Karo",
        },

        currentAffairs: {
          sectionTitle: "Daily Current Affairs",
          sectionDescription:
            "Exam ke liye important latest events se updated raho.",

          title: "Daily Current Affairs",

          description:
            "Important current affairs padho, samjho ki kya hua aur exam-focused information ke saath preparation karo.",

          action: "Aaj ke Current Affairs Padho →",
          badge: "FREE",
        },

        newspaper: {
          sectionTitle: "Daily Newspaper",
          sectionDescription:
            "Latest newspaper updates padho aur har din informed raho.",

          title: "Daily Newspaper",

          description:
            "Simple aur student-friendly format mein daily newspaper updates padho aur important national aur international news se connected raho.",

          action: "Aaj ka Newspaper Padho →",
          badge: "DAILY",
        },

        news: {
          sectionTitle: "What's in News",
          sectionDescription:
            "Sirf kya hua nahi, balki ye kyun important hai ye bhi samjho.",

          whatsInNews: {
            title: "What's in News",
            description:
              "Important events, developments aur headlines mein aane wale issues ko quickly aur easily samjho.",
            action: "News Explore Karo →",
            badge: "LATEST",
          },

          whyImportant: {
            title: "Why Important?",
            description:
              "Samjho ki koi news exam, society, economy, government aur country ke liye kyun important hai.",
            action: "Why Samjho →",
            badge: "EXAM FOCUS",
          },
        },

        askVidhya: {
          sectionTitle: "Ask Vidhya",
          sectionDescription:
            "Kisi concept mein stuck ho? Pucho, samjho aur seekho.",

          badge: "AI LEARNING ASSISTANT",

          title: "Ask Vidhya",

          description:
            "Apne words mein questions pucho aur difficult concepts ko jaldi samajhne ke liye clear aur student-friendly explanations pao.",

          askAnything: "Ask Anything",
          easyExplanations: "Easy Explanations",
          studyHelp: "Study Help",

          action: "Ask Vidhya",
        },

        vocabulary: {
          sectionTitle: "English Vocabulary",
          sectionDescription:
            "Strong vocabulary build karo aur daily English improve karo.",

          title: "Vocab-Bhaiya se English Seekho",

          description:
            "Vocabulary improve karo, useful words seekho aur interactive learning ke through English strong karo.",

          action: "Learning Start Karo →",
          badge: "EXTERNAL",
        },

        videos: {
          sectionTitle: "Video Learning",
          sectionDescription:
            "Video-based learning experience jaldi aa raha hai.",

          title: "Video Classes",

          description:
            "Engaging video lessons ke through seekho jo difficult concepts ko easy banane mein help karein.",

          action: "Jaldi Aa Raha Hai",
          badge: "COMING SOON",
        },

        about: {
          eyebrow: "ABOUT",
          title: "RANKER BHAIYA ke baare mein",

          description:
            "Ranker Bhaiya ko exam preparation ko simple, smart aur focused banane ke liye banaya gaya hai. Daily current affairs aur newspaper se lekar fast revision, AI learning aur vocabulary tak, sab kuch students ko consistently learn karne aur better preparation karne mein help karta hai.",

          examFocused: "Exam Focused",
          aiPowered: "AI Powered",
          studentFriendly: "Student Friendly",
        },

        footer: {
          tagline: "Smart tareeke se seekho. Fast grow karo.",
        },
      },

      currentAffairs: {
        label: "Current Affairs",
        title: "Daily Current Affairs",
        subtitle:
          "Exam preparation ke liye important events aur updates.",

        searchPlaceholder: "Current affairs search karo...",
        loading: "Current affairs load ho rahe hain...",
        loadError:
          "Current affairs load nahi ho sake. Dobara try karo.",

        allCategories: "All Categories",
        mixedTitle: "Latest Current Affairs",
        topics: "topics",

        mcqs: "MCQs",
        readMore: "Aur Padho",

        emptyTitle: "Koi current affair nahi mila",
        emptyDescription:
          "Search ya category filter change karke dekho.",

        categories: {
          All: "All",
          National: "National",
          International: "International",
          "Science & Tech": "Science & Tech",
          Economy: "Economy",
          Sports: "Sports",
          Awards: "Awards",
        },

        categoryTitles: {
          national: "National Updates",
          international: "International Affairs",
          scienceTech: "Science & Technology",
          economy: "Economy & Business",
          sports: "Sports",
          awards: "Awards & Appointments",
        },

        categoryDescriptions: {
          national:
            "Important national events aur government-related developments.",
          international:
            "Major international events, global developments aur important world news.",
          scienceTech:
            "Science, technology, space aur innovation se jude important developments.",
          economy:
            "Key economic developments, business news aur important financial updates.",
          sports:
            "Important sports events, tournaments, achievements aur major victories.",
          awards:
            "Important appointments, awards, honours aur news mein rehne wali personalities.",
        },

        detail: {
          back: "Current Affairs par wapas jao",
          whyInNews: "News mein kyun hai?",
          keyFacts: "Important Facts",
          examPoint: "Exam Point",
          staticGK: "Static GK",
          mcqs: "Practice MCQs",
          noMcqs:
            "Is topic ke liye koi MCQ available nahi hai.",
          loading: "Current affair load ho raha hai...",
          notFound: "Current affair nahi mila.",
        },
      },

      fastRevision: {
        title: "Fast Revision",
        subtitle:
          "AI ki help se important topics ko quickly revise karo.",
        subject: "Subject",
        topic: "Topic",
        difficulty: "Difficulty",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        generate: "Revision Generate Karo",
        generating: "Generate ho raha hai...",
        cards: "Revision Cards",
        quiz: "Quiz",
        next: "Next",
        previous: "Previous",
        submit: "Submit",
        score: "Tumhara Score",
        tryAgain: "Dobara Try Karo",
      },

      askVidhya: {
        title: "Ask Vidhya",
        subtitle:
          "Apne questions pucho aur study help lo.",
        placeholder: "Vidhya se kuch bhi pucho...",
        thinking: "Vidhya soch rahi hai...",
        send: "Send",
        newChat: "New Chat",
        history: "Chat History",
        noHistory: "Koi previous chat nahi hai.",
        unableToConnect:
          "Vidhya se connect nahi ho paya. Dobara try karo.",
      },

      newspaper: {
        title: "Daily Newspaper",
        subtitle:
          "Simple aur student-friendly format mein daily newspaper updates padho.",
        loading: "Newspaper load ho raha hai...",
        error:
          "Newspaper load nahi ho saka. Dobara try karo.",
        noNews: "Koi newspaper available nahi hai.",
        read: "Newspaper Padho",
      },

      vocabulary: {
        title: "English Vocabulary",
        subtitle:
          "Useful words aur meanings se apni English vocabulary improve karo.",
        open: "Vocabulary Open Karo",
      },

      videos: {
        title: "Learning Videos",
        subtitle:
          "Useful educational videos aur learning resources.",
        comingSoon: "Video Learning Jaldi Aa Rahi Hai",
      },

      about: {
        title: "RANKER BHAIYA ke baare mein",
        description:
          "Ranker Bhaiya ek student-focused learning platform hai jo exam preparation ko simple, smart aur effective banane ke liye banaya gaya hai.",
      },

      notFound: {
        title: "Page Nahi Mila",
        body:
          "Jo page tum search kar rahe ho woh exist nahi karta ya move ho gaya hai.",
        cta: "Home Jao",
      },
    },
  },
};

const getInitialLanguage = (): "en" | "hi" | "hinglish" => {
  if (typeof window === "undefined") return "en";

  const savedLanguage =
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem("vidyzen-language");

  if (
    savedLanguage === "en" ||
    savedLanguage === "hi" ||
    savedLanguage === "hinglish"
  ) {
    return savedLanguage;
  }

  return "en";
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: ["en", "hi", "hinglish"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
