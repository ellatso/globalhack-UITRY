
import React, { useState, useEffect, useRef, useMemo  } from "react";
import {
  Brain,
  MessageCircle,
  Users,
  Shield,
  Activity,
  Settings,
  Moon,
  Sun,
  Bell,
  TrendingUp,
  Heart,
  Sparkles,
  Calendar,
  Mic,
  Send,
  Plus,
  Star,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Award,
  BarChart3,
  Headphones,
  Trophy, // ← 新增
  Clock, // ← 新增（GoalRow、AchievementRow 會用）
  ChevronDown, // ← 若想做折疊箭頭時才需，否則可刪
  AlertCircle, // ← 這行是新的
  ArrowRight,
  Phone,
  MessageSquare,
  Music,
  ClipboardList
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import api from "./utils/api"; // ← 如果你放 utils/api.js，記得路徑改對


  
const PsyMuse = () => {
  const [currentScreen, setCurrentScreen] = useState("welcome");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentMood, setCurrentMood] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [chatMessage, setChatMessage] = useState("");
  const [notifications, setNotifications] = useState(3);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);
  const [banner, setBanner] = useState(null);
  
  const [musicOn, setMusicOn] = useState(false);
  const audioRef = useRef(null);
const [riskScore, setRiskScore] = useState(null);
const [isLoading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

const [trendOpen, setTrendOpen] = useState(false);
const [trendData, setTrendData] = useState(null);

const [coachOpen, setCoachOpen] = useState(false);
const [coachTips, setCoachTips] = useState([]);

const [isoOpen, setIsoOpen] = useState(false);
const [isoRows, setIsoRows] = useState([]); // CSV 預覽

const pttRecRef = useRef(null);
const [pttRecording, setPttRecording] = useState(false);
const [formCheckOpen, setFormCheckOpen] = useState(false);

  // 在組件頂部添加
const API_BASE_URL = 'your-api-endpoint';
const LLM_API_KEY = 'your-llm-api-key';

// TODO: swap to ElevenLabs Realtime WS via backend bridge (see /voice/session above)


// API 調用函數
const callLLMAPI = async (message, chatHistory) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        message,
        history: chatHistory,
        context: {
          mood: currentMood,
          energy: energyLevel,
          sleep: sleepQuality
        }
      })
    });
    return await response.json();
  } catch (error) {
    console.error('LLM API Error:', error);
    return { error: 'Failed to get response' };
  }
};
/*
// 建立 session + 連線 ws
const { data } = await api.post("/voice/session");
const ws = new WebSocket(data.ws_url);
ws.onopen = () => ws.send("hello");
ws.onmessage = (e) => console.log(e.data);

// 上傳單段語音
const fd = new FormData();
fd.append("audio", blob, "clip.webm");
const { data: r } = await api.post("/voice/utterance", fd); // 不手動設 Content-Type
console.log(r.text);

// 關閉 session
await api.post(`/voice/session/${data.sessionId}/close`);
ws.close();
*/
const submitAssessment = async (answers) => {
  try {
    const { data } = await api.post("/assessment", { answers });
    return data;
  } catch (error) {
    console.error("Assessment API Error:", error);
    return { error: "Failed to submit assessment" };
  }
}; 
useEffect(() => {
  console.log('audioRef.current ➜', audioRef.current);   // ❶ quick sanity check

  if (!audioRef.current) return;                         // ❷ bail out if null

  if (musicOn) {
    audioRef.current.volume = 0.4;
    audioRef.current.play().catch(() => {});
  } else {
    audioRef.current.pause();
  }
}, [musicOn]);
  

// ADD: 切換 live 的 handler（先假接）
const toggleLive = () => {
  setIsLive(v => !v);
  // TODO: swap to ElevenLabs Realtime WS
};

// ADD: PTT handler（先假接）
const handlePTTDown = () => setIsPTT(true);
const handlePTTUp = () => setIsPTT(false);



const startPTT = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "ptt.webm");
      // 後端：收到音檔→ASR→回 { text: "..." }
      const { data } = await api.post(`${VOICE_API}/utterance`, form, { headers: { "Content-Type": "multipart/form-data" } });
      if (data?.text) {
        setChatMessage(data.text);
        // 直接送出文字訊息
        handleSendMessage();
      } else {
        setBanner({ type: "error", msg: "ASR failed" });
      }
    };
    pttRecRef.current = rec;
    rec.start();
    setPttRecording(true);
  } catch {
    setBanner({ type: "error", msg: "Mic denied" });
  }
};
const stopPTT = () => {
  if (pttRecRef.current && pttRecRef.current.state !== "inactive") {
    pttRecRef.current.stop();
  }
  setPttRecording(false);
};
const tools = {
  logWorkout: async () => {
    try {
      await api.post("/tools/log-workout", { when: new Date().toISOString() });
      setBanner({ type: "success", msg: "Workout logged" });
    } catch { setBanner({ type: "error", msg: "Log failed" }); }
  },
  fetchHRV: async () => {
    try {
      const { data } = await api.get("/tools/hrv?days=7");
      setBanner({ type: "success", msg: `HRV: ${data?.rmssd ?? "–"}` });
    } catch { setBanner({ type: "error", msg: "Fetch HRV failed" }); }
  },
  formCheck: async () => {
    setFormCheckOpen(true); // 觸發影片/上傳彈窗（第 4 點會加）
  }
};




const handleOpenOrgTrend = () => {
  setTrendOpen(true);
  setTrendData(null); // 清空

  // 模擬 API 延遲
  setTimeout(() => {
    setTrendData({
      total_users: 25,
      distribution: { Low: 10, Moderate: 8, High: 5, Severe: 2 }
    });
  }, 500); // 半秒後出假資料
};


const handleGetCoachTips = () => {
  setCoachOpen(true);
  setCoachTips([]);
  setTimeout(() => {
    setCoachTips([
      "Encourage open communication",
      "Offer flexible work arrangements",
      "Organize team-building activities"
    ]);
  }, 500);
};
const handleDownloadISO = () => {
  setIsoOpen(true);
  setIsoRows([]);
  setTimeout(() => {
    setIsoRows([
      ["metric", "value"],
      ["total_users", "25"],
      ["risk_low", "10"],
      ["risk_moderate", "8"],
      ["risk_high", "5"],
      ["risk_severe", "2"],
    ]);
  }, 500);
};
  // Fake API data
  const [userProfile] = useState({
    name: "Alex",
    streak: 7,
    totalSessions: 23,
    improvementScore: 78,
    avatar: "🦋",
  });


  // Voice live session
const [isLive, setIsLive] = useState(false);
const [liveSessionId, setLiveSessionId] = useState(null);
const mediaStreamRef = useRef(null);
const wsRef = useRef(null);
const [isPTT, setIsPTT] = useState(false);


// 你的後端 API base（沿用現有變數）
const VOICE_API = `${API_BASE_URL}/voice`;

// 開始語音：向後端建立 Realtime session，取得 ws_url/token，並串 mic
const startLive = async () => {
  try {
    setIsConnecting(true);
    // 1) 叫後端建立 session
    const { data } = await api.post(`${VOICE_API}/session`, {
      model: "elevenlabs-realtime", // 你後端轉接 ElevenLabs 可自定
    }); // → { sessionId, ws_url, token }

    setLiveSessionId(data.sessionId);

    // 2) 打開 mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    // 3) 建立 WS，把 audio chunks 推到後端（後端再轉給 ElevenLabs）
    wsRef.current = new WebSocket(`${data.ws_url}?token=${data.token}`);
    wsRef.current.onopen = () => {
      setIsLive(true);
      setBanner({ type: "success", msg: "Live connected" });
      // 以 MediaRecorder 切片送
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      rec.ondataavailable = (e) => {
        if (wsRef.current?.readyState === 1 && e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => wsRef.current.send(buf));
        }
      };
      rec.start(250);
      wsRef.current.__rec = rec;
    };
    wsRef.current.onmessage = (evt) => {
      // 後端回傳文字或 TTS 事件（可按你協議解析）
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "transcript" && msg.text) {
          // 將 AI 文字回覆加入訊息串
          setChatMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              sender: "dr-muse",
              content: msg.text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              avatar: "👩‍⚕️",
            },
          ]);
        }
      } catch {}
    };
    wsRef.current.onclose = () => stopLive(true);
    wsRef.current.onerror = () => stopLive(true);
  } catch (e) {
    setBanner({ type: "error", msg: "Live connect failed" });
  } finally {
    setIsConnecting(false);
  }
};

const stopLive = async (fromWS = false) => {
  try {
    if (wsRef.current) {
      if (wsRef.current.__rec) wsRef.current.__rec.stop();
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (!fromWS && liveSessionId) {
      await api.post(`${VOICE_API}/session/${liveSessionId}/close`);
    }
  } catch {}
  setIsLive(false);
  setLiveSessionId(null);
  setBanner({ type: "success", msg: "Live stopped" });
};
  const [chatMessages, setChatMessages] = useState([
  {
    id: 1,
    sender: "dr-muse",
    content: "Hey Alex — we’ll keep it steady today. Want a quick pre-game focus or a short mindfulness reset?",
    timestamp: "10:30 AM",
    avatar: "👩‍⚕️",
  },
]);

  const [communityPosts] = useState([
    {
      id: 1,
      author: "Phoenix_Hope",
      content:
        "Felt nervous before the match today, but used breathing techniques to refocus. 💙",
      timestamp: "2h ago",
      likes: 12,
      replies: 3,
      circle: "Work Burned Out Circle",
      avatar: "🦋",
    },
    {
      id: 2,
      author: "MidnightWarrior",
      content:
        "Great hustle today! Your defense was on point.",
      timestamp: "1h ago",
      likes: 8,
      replies: 1,
      circle: "Work Burned Out Circle",
      avatar: "🌙",
    },
  ]);

  const [recommendations] = useState([
    {
      type: "mindfulness",
      title: "Warm-up Stretch Routine",
      duration: "15 min",
      description: "You respond well to breathing exercises when Burned Out",
      icon: "🧘‍♀️",
      color: "from-purple-500 to-pink-500",
      progress: 0,
    },
    {
      type: "activity",
      title: 	"Recovery Jog",
      duration: "20 min",
      description: "Fresh air helps your energy",
      icon: "🚶‍♂️",
      color: "from-green-500 to-teal-500",
      progress: 0,
    },
    {
      type: "social",
      title: "Team Strategy Session",
      duration: "10 min",
      description: "You haven't talked to teammates in 3 days",
      icon: "👥",
      color: "from-blue-500 to-indigo-500",
      progress: 0,
    },
  ]);

  const moods = [
    {
      emoji: "😊",
      label: "Energized",
      value: 5,
      color: "from-green-400 to-emerald-500",
    },
    {
      emoji: "🙂",
      label: "Focused",
      value: 4,
      color: "from-blue-400 to-cyan-500",
    },
    {
      emoji: "😐",
      label: "Balanced",
      value: 3,
      color: "from-yellow-400 to-orange-500",
    },
    {
      emoji: "😔",
      label: "Fatigued",
      value: 2,
      color: "from-orange-400 to-red-500",
    },
    {
      emoji: "😢",
      label: "Burned Out",
      value: 1,
      color: "from-red-400 to-pink-500",
    },
  ];
useEffect(() => {
  if (!banner) return;
  const timer = setTimeout(() => setBanner(null), 3000);
  return () => clearTimeout(timer);
}, [banner]);




const handleSendMessage = async () => {
  if (chatMessage.trim()) {
    const newMessage = {
      id: chatMessages.length + 1,
      sender: "user",
      content: chatMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: "👤",
    };
    
    setChatMessages((prev) => [...prev, newMessage]);
    setChatMessage("");
    setIsTyping(true);

    // 調用真實 LLM API
    const aiResponse = await callLLMAPI(chatMessage, chatMessages);
    
    setIsTyping(false);
    
    if (aiResponse.error) {
        setBanner({ type: "error", msg: `Chat API failed: ${aiResponse.error}` });
    } else {
        setBanner({ type: "success", msg: "Reply received ✔" });
        const response = {
        id: chatMessages.length + 2,
        sender: "dr-muse",
        content: aiResponse.message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        avatar: "👩‍⚕️",
      };
      setChatMessages(prev => [...prev, response]);
      }
  }
}; 

  // Quiz questions for performance assessment
const quizQuestions = [
  {
    id: 1,
    question: "How often did you reach your target training intensity this week?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "intensity",
  },
  {
    id: 2,
    question: "How well did you execute your training plan as scheduled?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "execution",
  },
  {
    id: 3,
    question: "How often did you maintain focus during practice or competition?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "focus",
  },
  {
    id: 4,
    question: "How would you rate your recovery quality after sessions?",
    options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"],
    category: "recovery",
  },
  {
    id: 5,
    question: "How often did you feel energized at training start?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "energy_start",
  },
  {
    id: 6,
    question: "How confident were you with play calls or tactics?",
    options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"],
    category: "confidence",
  },
  {
    id: 7,
    question: "How satisfied are you with your current performance?",
    options: ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"],
    category: "satisfaction",
  },
  {
    id: 8,
    question: "How often did you complete mobility or stretching work?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "mobility",
  },
  {
    id: 9,
    question: "How would you rate your sleep over the past week?",
    options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"],
    category: "sleep",
  },
  {
    id: 10,
    question: "How often did you fuel and hydrate according to plan?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "nutrition",
  },
  {
    id: 11,
    question: "How often did you experience muscle soreness that limited output?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "soreness",
  },
  {
    id: 12,
    question: "How effectively did you manage nerves or pre-game stress?",
    options: ["Very Poorly", "Poorly", "Okay", "Well", "Very Well"],
    category: "stress_management",
  },
  {
    id: 13,
    question: "How often did you communicate proactively with teammates/coaches?",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
    category: "communication",
  },
  {
    id: 14,
    question: "How would you rate your stamina late in sessions or games?",
    options: ["Very Low", "Low", "Moderate", "High", "Very High"],
    category: "stamina",
  },
  {
    id: 15,
    question: "How consistent was your training across the week?",
    options: ["Very Inconsistent", "Inconsistent", "Neutral", "Consistent", "Very Consistent"],
    category: "consistency",
  },
];





  

  const WelcomeScreen = () => (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-700 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900"
          : "bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-gradient-to-tr from-indigo-300/20 to-blue-300/20 rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="text-center space-y-8 max-w-md relative z-10">
        <div className="relative">
          <div
            className={`w-32 h-32 mx-auto rounded-3xl ${
              isDarkMode
                ? "bg-gradient-to-br from-purple-600 to-indigo-700"
                : "bg-gradient-to-br from-purple-400 to-pink-500"
            } flex items-center justify-center mb-6 animate-bounce shadow-2xl`}
          >
            <Brain className="w-16 h-16 text-white" />
          </div>
          <Sparkles className="absolute top-2 right-1/4 w-8 h-8 text-yellow-400 animate-ping" />
          <Zap className="absolute bottom-2 left-1/4 w-6 h-6 text-blue-400 animate-bounce delay-500" />
        </div>

        <div className="space-y-6">
          <h1
            className={`text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent`}
          >
            NeuroMotin
          </h1>
          <div className="space-y-2">
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Your AI Sports Coach for 
            </p>
            <p
              className={`text-xl font-semibold bg-gradient-to-r ${
                isDarkMode
                  ? "from-purple-300 to-pink-300"
                  : "from-purple-600 to-pink-600"
              } bg-clip-text text-transparent`}
            >
              Performance Insight ✨
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentScreen("dashboard")}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-8 py-5 rounded-3xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="relative flex items-center justify-center space-x-2">
              <Target className="w-6 h-6" />
              <span>Start Your Journey</span>
            </span>
          </button>
          <button
            className={`w-full ${
              isDarkMode
                ? "bg-slate-800/50 backdrop-blur text-slate-200 hover:bg-slate-700/50"
                : "bg-white/70 backdrop-blur text-gray-700 hover:bg-white/90"
            } px-8 py-4 rounded-3xl font-semibold border border-white/20 transition-all duration-300 transform hover:-translate-y-1`}
          >
            <span className="flex items-center justify-center space-x-2">
              <Users className="w-5 h-5" />
              <span>I'm a Returning User</span>
            </span>
          </button>
        </div>

        <div
          className={`${
            isDarkMode ? "bg-slate-800/30" : "bg-white/30"
          } backdrop-blur rounded-2xl p-4 border border-white/20`}
        >
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-300" : "text-gray-600"
            } italic`}
          >
            "Safe, Private, Always Here for You 💝"
          </p>
        </div>

        <div className="mt-8 text-xs opacity-70">
  Voice powered by ElevenLabs (low-latency)
</div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 to-indigo-900"
          : "bg-gradient-to-br from-purple-50 to-indigo-100"
      } pb-20`}
    >
      {/* Header */}
      <div
        className={`${
          isDarkMode ? "bg-slate-800/90" : "bg-white/90"
        } backdrop-blur border-b ${
          isDarkMode ? "border-slate-700" : "border-purple-200"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1
              className={`text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}
            >
              NeuroMotin 
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl ${
                isDarkMode
                  ? "bg-slate-700 text-yellow-400"
                  : "bg-purple-100 text-purple-600"
              } transition-all duration-300 hover:scale-110`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}

            
            </button>

            {/* 新增 ▶️/⏸️ 音樂切換 */}
  <button
  onClick={() => {setMusicOn(prev => {

      
      if (!prev && audioRef.current) {
        
        audioRef.current.play().catch(err => {
          console.log("Autoplay blocked:", err);
        });
      }
      return !prev;
    });
    
  }}
  className={`p-2 rounded-xl transition
      ${musicOn
        ? "bg-emerald-500 text-white hover:bg-emerald-600"
        : isDarkMode
          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
          : "bg-purple-100 text-purple-600 hover:bg-purple-200"}`}
    title={musicOn ? "Pause music" : "Play music"}
>
  <Music className="w-5 h-5" />
</button>
            <div className="relative">
              <Bell
                className={`w-6 h-6 ${
                  isDarkMode ? "text-slate-300" : "text-purple-600"
                }`}
              />
              {notifications > 0 && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {notifications}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Greeting & Profile */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-3xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                ☀️ Good Morning!
              </h2>
              <p
                className={`text-lg ${
                  isDarkMode ? "text-slate-300" : "text-gray-600"
                }`}
              >
                Welcome back, {userProfile.name} {userProfile.avatar}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-purple-300" : "text-purple-600"
                }`}
              >
                {userProfile.streak} 🔥
              </div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-gray-500"
                }`}
              >
                Day streak
              </p>
            </div>
          </div>

          {/* Predictive Alert */}
          <div
            className={`bg-gradient-to-r ${
              isDarkMode
                ? "from-amber-900/30 to-orange-900/30 border-amber-700"
                : "from-amber-50 to-orange-50 border-amber-300"
            } border p-4 rounded-2xl shadow-lg`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span
                className={`font-bold ${
                  isDarkMode ? "text-amber-200" : "text-amber-800"
                }`}
              >
                🔮 AI Insight
              </span>
            </div>
            <p
              className={`${
                isDarkMode ? "text-amber-100" : "text-amber-700"
              } text-sm`}
            >
              "Your training data suggests you may need a lighter recovery session this week to optimize peak performance."
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`${
              isDarkMode ? "bg-slate-800/50" : "bg-white/70"
            } backdrop-blur p-4 rounded-2xl border ${
              isDarkMode ? "border-slate-700" : "border-purple-200"
            } text-center`}
          >
            <div className="text-2xl font-bold text-green-500">
              {userProfile.totalSessions}
            </div>
            <p
              className={`text-xs ${
                isDarkMode ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Training Sessions
            </p>
          </div>
          <div
            className={`${
              isDarkMode ? "bg-slate-800/50" : "bg-white/70"
            } backdrop-blur p-4 rounded-2xl border ${
              isDarkMode ? "border-slate-700" : "border-purple-200"
            } text-center`}
          >
            <div className="text-2xl font-bold text-purple-500">
              {userProfile.improvementScore}%
            </div>
            <p
              className={`text-xs ${
                isDarkMode ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Progress
            </p>
          </div>
          <div
            className={`${
              isDarkMode ? "bg-slate-800/50" : "bg-white/70"
            } backdrop-blur p-4 rounded-2xl border ${
              isDarkMode ? "border-slate-700" : "border-purple-200"
            } text-center`}
          >
            <div className="text-2xl font-bold text-blue-500">A+</div>
            <p
              className={`text-xs ${
                isDarkMode ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Performance Grade
            </p>
          </div>
        </div>

        {/* Mood Check-in */}
        <div
          className={`${
            isDarkMode ? "bg-slate-800/50" : "bg-white/70"
          } backdrop-blur p-6 rounded-3xl border ${
            isDarkMode ? "border-slate-700" : "border-purple-200"
          } shadow-xl`}
        >
          <h3
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-4`}
          >
            📊 Daily Performance Check-in
          </h3>
          <p
            className={`${
              isDarkMode ? "text-slate-300" : "text-gray-600"
            } mb-6`}
          >
            How are you feeling right now?
          </p>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {moods.map((mood, index) => (
              <button
                key={index}
                onClick={() => setCurrentMood(mood.value)}
                className={`relative p-4 rounded-2xl transition-all duration-500 transform hover:scale-110 ${
                  currentMood === mood.value
                    ? `bg-gradient-to-br ${mood.color} text-white shadow-lg scale-105`
                    : `${
                        isDarkMode
                          ? "bg-slate-700/50 hover:bg-slate-600/50"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`
                }`}
              >
                <div className="text-2xl mb-1">{mood.emoji}</div>
                <div className="text-xs font-medium">{mood.label}</div>
                {currentMood === mood.value && (
                  <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  Stamina Level
                </span>
                <span
                  className={`text-sm font-bold ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {energyLevel}/10
                </span>
              </div>
              <div
                className={`w-full ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-200"
                } rounded-full h-3`}
              >
                <div
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-3 rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ width: `${energyLevel * 10}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  Recovery Quality
                </span>
                <span
                  className={`text-sm font-bold ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                >
                  {sleepQuality}/10
                </span>
              </div>
              <div
                className={`w-full ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-200"
                } rounded-full h-3`}
              >
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ width: `${sleepQuality * 10}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentScreen("chat")}
            className={`${
              isDarkMode
                ? "bg-slate-800/50 hover:bg-slate-700/50"
                : "bg-white/70 hover:bg-white/90"
            } backdrop-blur p-6 rounded-3xl border ${
              isDarkMode ? "border-slate-700" : "border-purple-200"
            } shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl group`}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h4
              className={`font-bold text-lg ${
                isDarkMode ? "text-white" : "text-gray-800"
              } mb-2`}
            >
              Chat with Coach Motin
            </h4>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              Get AI support & guidance
            </p>
          </button>

          <button
            onClick={() => setCurrentScreen("community")}
            className={`${
              isDarkMode
                ? "bg-slate-800/50 hover:bg-slate-700/50"
                : "bg-white/70 hover:bg-white/90"
            } backdrop-blur p-6 rounded-3xl border ${
              isDarkMode ? "border-slate-700" : "border-purple-200"
            } shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl group`}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4
              className={`font-bold text-lg ${
                isDarkMode ? "text-white" : "text-gray-800"
              } mb-2`}
            >
              Team Locker Room
            </h4>
            <p
              className={`text-sm ${
                isDarkMode ? "text-slate-400" : "text-gray-500"
              }`}
            >
              Anonymous peer support
            </p>
          </button>
        </div>

        {/* Recommendations */}
        <div
          className={`${
            isDarkMode ? "bg-slate-800/50" : "bg-white/70"
          } backdrop-blur p-6 rounded-3xl border ${
            isDarkMode ? "border-slate-700" : "border-purple-200"
          } shadow-xl`}
        >
          <h3
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-6`}
          >
            🎯 Personalized Training Tips
          </h3>

          <button
  onClick={() => setFormCheckOpen(true)}
  className={`w-full ${isDarkMode ? "bg-slate-700/50 hover:bg-slate-600/50" : "bg-gray-50 hover:bg-gray-100"} p-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg`}
>
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl">📹</div>
      <div className="text-left">
        <h4 className={`${isDarkMode ? "text-white" : "text-gray-800"} font-bold`}>Form Check (beta)</h4>
        <p className={`${isDarkMode ? "text-slate-300" : "text-gray-600"} text-sm`}>Upload a short clip or use camera for posture tips</p>
      </div>
    </div>
    <ChevronRight className={`${isDarkMode ? "text-slate-400" : "text-gray-400"} w-5 h-5`} />
  </div>
</button>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <button
                key={index}
                className={`w-full ${
                  isDarkMode
                    ? "bg-slate-700/50 hover:bg-slate-600/50"
                    : "bg-gray-50 hover:bg-gray-100"
                } p-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg group`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${rec.color} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
                    >
                      {rec.icon}
                    </div>
                    <div className="text-left">
                      <h4
                        className={`font-bold ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {rec.title}
                      </h4>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-slate-300" : "text-gray-600"
                        } mb-1`}
                      >
                        {rec.description}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-purple-400" : "text-purple-600"
                        }`}
                      >
                        {rec.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <ChevronRight
                      className={`w-5 h-5 ${
                        isDarkMode ? "text-slate-400" : "text-gray-400"
                      } group-hover:translate-x-1 transition-transform duration-300`}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Crisis Support - Moved up */}
      <div
        className={`bg-gradient-to-r ${
          isDarkMode
            ? "from-red-900/30 to-pink-900/30 border-red-700"
            : "from-red-50 to-pink-50 border-red-300"
        } border-2 p-4 rounded-2xl shadow-lg animate-pulse`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span
                className={`font-bold text-lg ${
                  isDarkMode ? "text-red-200" : "text-red-800"
                }`}
              >
                🚨 Injury & Recovery Support
              </span>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-red-300" : "text-red-600"
                }`}
              >
                Available 24/7 - You're not alone
              </p>
            </div>
          </div>
          <button className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            Get Help Now
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${
          isDarkMode ? "bg-slate-800/90" : "bg-white/90"
        } backdrop-blur border-t ${
          isDarkMode ? "border-slate-700" : "border-purple-200"
        }`}
      >
        <div className="flex justify-around py-3 max-w-md mx-auto">
          <button
            onClick={() => setCurrentScreen("dashboard")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "dashboard"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Activity className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentScreen("chat")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "chat"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Chat</span>
          </button>
          <button
            onClick={() => setCurrentScreen("community")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "community"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Community</span>
          </button>
          <button
            onClick={() => setCurrentScreen("progress")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Progress</span>
          </button>

          <button
            onClick={() => setCurrentScreen("quiz")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "quiz"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Target className="w-6 h-6" />
            <span className="text-xs font-medium">Quiz</span>
          </button>
        </div>
      </div>



      {/* Org Trend / Risk Score Popup */}
{trendOpen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
      <h3 className="text-lg font-semibold mb-3">Org Trend</h3>

      {/* Risk Score 假資料 */}
      <p className="text-sm mb-2">Total Users: 25</p>
      <ul className="text-sm space-y-1">
        <li>Low: 10</li>
        <li>Moderate: 8</li>
        <li>High: 5</li>
        <li>Severe: 2</li>
      </ul>

      {/* 新增 職場 Stress Weekly Evaluation 區塊 */}
      <div className="mt-6 p-4 rounded-lg border bg-gray-50">
        <h4 className="font-semibold text-base mb-2">📊 Endurance Training Group</h4>
        <p className="text-sm text-gray-600 mb-3">
          This week's average performance score is <span className="font-bold text-red-500">72/100</span>, showing strong endurance but slower reaction time in the second half.
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">
            Take Test
          </button>
          <button className="px-3 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400">
            View Report
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          className="px-3 py-2 rounded bg-slate-800 text-white"
          onClick={() => setTrendOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{/* ✅ Coaching Tips Popup */}
{coachOpen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
      <h3 className="text-lg font-semibold mb-3">Coaching Tips</h3>

      {coachTips.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <ul className="list-disc list-inside text-sm space-y-1">
          {coachTips.map((t,i)=><li key={i}>{t}</li>)}
        </ul>
      )}

      <div className="mt-4 flex gap-2 justify-end">
        <button className="px-3 py-2 rounded border" onClick={handleGetCoachTips}>Refresh</button>
        <button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={()=>setCoachOpen(false)}>Close</button>
      </div>
    </div>
  </div>
)}

{/* ✅ ISO 45003 Preview Popup */}
{isoOpen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl overflow-auto max-h-[80vh]">
      <h3 className="text-lg font-semibold mb-3">ISO 45003 Metrics</h3>

      {isoRows.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <table className="w-full text-sm border">
          <tbody>
            {isoRows.map((r,i)=>(
              <tr key={i}>{r.map((c,j)=><td key={j} className="border px-2 py-1">{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex gap-2 justify-end">
        <button className="px-3 py-2 rounded border" onClick={handleDownloadISO}>Re-download</button>
        <button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={()=>setIsoOpen(false)}>Close</button>
      </div>
    </div>
  </div>
)}


    </div>
  );


  {/* 📹 Form Check Popup */}
{formCheckOpen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
    <div className={`${isDarkMode ? "bg-slate-900 text-white" : "bg-white"} rounded-2xl p-6 w-full max-w-md shadow-xl`}>
      <h3 className="text-lg font-semibold mb-3">Form Check</h3>
      <input id="formVideo" type="file" accept="video/*" className="block w-full mb-4" />
      <div className="flex justify-end gap-2">
        <button onClick={() => setFormCheckOpen(false)} className="px-3 py-2 rounded border">Close</button>
        <button
          onClick={async () => {
            const f = document.getElementById("formVideo").files?.[0];
            if (!f) return setBanner({ type: "error", msg: "No video selected" });
            const fd = new FormData(); fd.append("video", f);
            try {
              const { data } = await api.post("/tools/form-check", fd, { headers: { "Content-Type": "multipart/form-data" }});
              setBanner({ type: "success", msg: data?.summary || "Form analyzed" });
              setFormCheckOpen(false);
            } catch {
              setBanner({ type: "error", msg: "Analyze failed" });
            }
          }}
          className="px-3 py-2 rounded bg-indigo-600 text-white"
        >
          Upload & Analyze
        </button>
      </div>
    </div>
  </div>
)}
  const ChatScreen = () => (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 to-indigo-900"
          : "bg-gradient-to-br from-purple-50 to-indigo-100"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          isDarkMode ? "bg-slate-800/90" : "bg-white/90"
        } backdrop-blur border-b ${
          isDarkMode ? "border-slate-700" : "border-purple-200"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className={`p-2 rounded-xl ${
                isDarkMode ? "hover:bg-slate-700" : "hover:bg-purple-100"
              } transition-all duration-300`}
            >
              <ChevronRight
                className={`w-5 h-5 transform rotate-180 ${
                  isDarkMode ? "text-slate-400" : "text-purple-600"
                }`}
              />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">👩‍⚕️</span>
              </div>
              <div>
                <h1
                  className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Coach Motin
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className={`text-sm ${isDarkMode ? "text-green-400" : "text-green-600"} font-medium`}>
  Calm, here to coach you
</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`p-3 rounded-xl ${
                isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-purple-100 hover:bg-purple-200"
              } transition-all duration-300`}
            >
              <Headphones
                className={`w-5 h-5 ${
                  isDarkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
            </button>
            <button
              className={`p-3 rounded-xl ${
                isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-purple-100 hover:bg-purple-200"
              } transition-all duration-300`}
            >
              <Settings
                className={`w-5 h-5 ${
                  isDarkMode ? "text-slate-400" : "text-purple-600"
                }`}
              />
            </button>

            <button
  onClick={() => (isLive ? stopLive() : startLive())}
  className={`p-3 rounded-xl ${isDarkMode ? "bg-slate-700 hover:bg-slate-600" : "bg-purple-100 hover:bg-purple-200"} transition-all duration-300`}
  disabled={isConnecting}
  title={isLive ? "Stop" : "Go Live"}
>
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-slate-400"}`} />
    <span className={`text-xs ${isDarkMode ? "text-slate-200" : "text-purple-700"}`}>{isLive ? "LIVE" : "Go Live"}</span>
  </div>
</button>
          </div>
        </div>
      </div>


      {/* Tool chips */}
<div className="p-4">
  <div className="flex gap-2 flex-wrap">
    {[
      { label: "Log Workout", onClick: tools.logWorkout },
      { label: "Fetch HRV", onClick: tools.fetchHRV },
      { label: "Form Check (Camera)", onClick: tools.formCheck },
    ].map((c) => (
      <button
        key={c.label}
        onClick={c.onClick}
        className={`${isDarkMode ? "bg-slate-800 text-slate-200 border-slate-600" : "bg-white text-gray-700 border-purple-200"} px-3 py-1.5 rounded-2xl text-xs border hover:opacity-90`}
      >
        {c.label}
      </button>
    ))}
  </div>
</div> 

      {/* Messages */}
      <div className="p-4 pb-32 space-y-6 max-h-screen overflow-y-auto">
        {chatMessages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } animate-fadeIn`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-xs lg:max-w-md ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white shadow-xl"
                  : isDarkMode
                  ? "bg-slate-800/70 text-white border border-slate-600"
                  : "bg-white/90 text-gray-800 border border-purple-200"
              } px-5 py-4 rounded-3xl backdrop-blur shadow-lg`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-between mt-3">
                <span
                  className={`text-xs ${
                    message.sender === "user"
                      ? "text-purple-100"
                      : isDarkMode
                      ? "text-slate-400"
                      : "text-gray-500"
                  }`}
                >
                  {message.timestamp}
                </span>
                {message.sender !== "user" && (
  <span className={`text-[10px] ${isDarkMode ? "text-slate-500" : "text-gray-400"}`}>
    • Reasoned from: mood/sleep/last check-in • Confidence: High
  </span>
)}
                {message.sender === "user" && (
                  <CheckCircle className="w-4 h-4 text-purple-200" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div
              className={`max-w-xs px-5 py-4 rounded-3xl ${
                isDarkMode
                  ? "bg-slate-800/70 border border-slate-600"
                  : "bg-white/90 border border-purple-200"
              } backdrop-blur shadow-lg`}
            >
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  Coach Motin is typing...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick mood check */}
        <div
          className={`${
            isDarkMode ? "bg-slate-800/70" : "bg-white/90"
          } backdrop-blur p-5 rounded-3xl border ${
            isDarkMode ? "border-slate-600" : "border-purple-200"
          } shadow-xl`}
        >
          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-300" : "text-gray-600"
            } mb-4 font-medium`}
          >
            Quick Performance State check:
          </p>
          <div className="grid grid-cols-5 gap-3">
            {moods.map((mood, index) => (
              <button
                key={index}
                onClick={() => setCurrentMood(mood.value)}
                className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  currentMood === mood.value
                    ? `bg-gradient-to-br ${mood.color} text-white shadow-lg`
                    : `${
                        isDarkMode
                          ? "bg-slate-700/50 hover:bg-slate-600/50"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`
                }`}
              >
                <div className="text-2xl">{mood.emoji}</div>
                <div className="text-xs font-medium mt-1">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${
          isDarkMode ? "bg-slate-800/90" : "bg-white/90"
        } backdrop-blur border-t ${
          isDarkMode ? "border-slate-700" : "border-purple-200"
        } p-4`}
      >
        <div className="flex items-center space-x-3 max-w-md mx-auto">
          <div
            className={`flex-1 ${
              isDarkMode ? "bg-slate-700/50" : "bg-purple-50"
            } rounded-3xl px-5 py-4 flex items-center space-x-3 border ${
              isDarkMode ? "border-slate-600" : "border-purple-200"
            }`}
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Share what's on your mind..."
              className={`flex-1 ${
                isDarkMode
                  ? "bg-transparent text-white placeholder-slate-400"
                  : "bg-transparent text-gray-800 placeholder-gray-500"
              } outline-none text-sm`}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
  onMouseDown={startPTT}
  onMouseUp={stopPTT}
  onTouchStart={startPTT}
  onTouchEnd={stopPTT}
  className={`p-2 ${isDarkMode ? "hover:bg-slate-600" : "hover:bg-purple-100"} rounded-xl transition-all duration-300`}
>
  <Mic className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
  <span className={`ml-2 text-xs ${isDarkMode ? "text-slate-300" : "text-gray-600"}`}>
    {pttRecording ? "Recording..." : "Hold to talk"}
  </span>
</button>

          </div>
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white p-4 rounded-3xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50"
            disabled={!chatMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const CommunityScreen = () => (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 to-indigo-900"
          : "bg-gradient-to-br from-purple-50 to-indigo-100"
      } pb-20`}
    >
      {/* Header */}
      <div
        className={`${
          isDarkMode ? "bg-slate-800/90" : "bg-white/90"
        } backdrop-blur border-b ${
          isDarkMode ? "border-slate-700" : "border-purple-200"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className={`p-2 rounded-xl ${
                isDarkMode ? "hover:bg-slate-700" : "hover:bg-purple-100"
              } transition-all duration-300`}
            >
              <ChevronRight
                className={`w-5 h-5 transform rotate-180 ${
                  isDarkMode ? "text-slate-400" : "text-purple-600"
                }`}
              />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Safe Space
              </h1>
            </div>
          </div>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            + Create Circle
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Supportive Moment */}
        <div
          className={`bg-gradient-to-r ${
            isDarkMode
              ? "from-emerald-900/50 to-green-900/50 border-emerald-700"
              : "from-emerald-50 to-green-50 border-emerald-300"
          } border-2 p-5 rounded-3xl shadow-xl`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span
              className={`font-bold text-lg ${
                isDarkMode ? "text-emerald-200" : "text-emerald-800"
              }`}
            >
              Today's Supportive Moment
            </span>
          </div>
          <p
            className={`${
              isDarkMode ? "text-emerald-100" : "text-emerald-700"
            } text-sm italic`}
          >
            "Someone shared that small wins matter too. Thank you, Phoenix_Hope!
            💚"
          </p>
        </div>

        {/* Support Circles */}
        <div>
          <h3
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-5`}
          >
            🔥 Active Support Circles
          </h3>
          <div className="space-y-4">
            {[
              {
                name: "💼 Endurance Training Group",
                members: 47,
                description: "Dealing with burnout together",
                color: "from-blue-500 to-indigo-600",
                online: 12,
              },
              {
                name: "💔 Team Strategy Talk",
                members: 31,
                description: "Healing hearts together",
                color: "from-pink-500 to-rose-600",
                online: 8,
              },
              {
                name: "🌙 Muscle Struggles",
                members: 23,
                description: "recovery support & tips",
                color: "from-purple-500 to-violet-600",
                online: 5,
              },
            ].map((circle, index) => (
              <div
                key={index}
                className={`${
                  isDarkMode ? "bg-slate-800/70" : "bg-white/90"
                } backdrop-blur p-5 rounded-3xl border ${
                  isDarkMode ? "border-slate-600" : "border-purple-200"
                } shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${circle.color} rounded-2xl flex items-center justify-center`}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-lg ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {circle.name}
                      </h4>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-slate-400" : "text-gray-600"
                        } mb-1`}
                      >
                        {circle.members} members • {circle.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-green-400" : "text-green-600"
                          } font-medium`}
                        >
                          {circle.online} online now
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    className={`bg-gradient-to-r ${circle.color} text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Community Posts */}
        <div>
          <h3
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-5`}
          >
            💬 Recent Support Messages
          </h3>
          <div className="space-y-5">
            {communityPosts.map((post) => (
              <div
                key={post.id}
                className={`${
                  isDarkMode ? "bg-slate-800/70" : "bg-white/90"
                } backdrop-blur p-5 rounded-3xl border ${
                  isDarkMode ? "border-slate-600" : "border-purple-200"
                } shadow-xl hover:shadow-2xl transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-xl">
                      {post.avatar}
                    </div>
                    <div>
                      <p
                        className={`font-bold ${
                          isDarkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {post.author}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p
                          className={`text-xs ${
                            isDarkMode ? "text-purple-400" : "text-purple-600"
                          } font-medium`}
                        >
                          {post.circle}
                        </p>
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-slate-400" : "text-gray-500"
                          }`}
                        >
                          •
                        </span>
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-slate-400" : "text-gray-500"
                          }`}
                        >
                          {post.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p
                  className={`${
                    isDarkMode ? "text-slate-200" : "text-gray-700"
                  } text-sm mb-4 leading-relaxed`}
                >
                  {post.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 text-pink-500 hover:text-pink-600 transition-colors duration-300">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    <button
                      className={`flex items-center space-x-2 ${
                        isDarkMode
                          ? "text-slate-400 hover:text-slate-200"
                          : "text-gray-500 hover:text-gray-700"
                      } transition-colors duration-300`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {post.replies}
                      </span>
                    </button>
                  </div>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Send Love 💙
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Guidelines */}
        <div
          className={`${
            isDarkMode
              ? "bg-slate-800/70 border-slate-600"
              : "bg-white/90 border-purple-200"
          } backdrop-blur border-2 p-5 rounded-3xl shadow-xl`}
        >
          <h4
            className={`font-bold text-lg ${
              isDarkMode ? "text-white" : "text-gray-800"
            } mb-4`}
          >
            🛡️ Community Guidelines
          </h4>
          <div
            className={`text-sm ${
              isDarkMode ? "text-slate-300" : "text-gray-600"
            } space-y-2`}
          >
            <p>• Be kind and supportive to everyone</p>
            <p>• No advice unless specifically asked</p>
            <p>• Share experiences, not judgments</p>
            <p>• Respect everyone's anonymity</p>
            <p>• Report any harmful behavior</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${
          isDarkMode ? "bg-slate-800/90" : "bg-white/90"
        } backdrop-blur border-t ${
          isDarkMode ? "border-slate-700" : "border-purple-200"
        }`}
      >
        <div className="flex justify-around py-3 max-w-md mx-auto">
          <button
            onClick={() => setCurrentScreen("dashboard")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "dashboard"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Activity className="w-6 h-6" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentScreen("chat")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "chat"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Chat</span>
          </button>
          <button
            onClick={() => setCurrentScreen("community")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "community"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Community</span>
          </button>
          <button
            onClick={() => setCurrentScreen("progress")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Progress</span>
          </button>

          <button
            onClick={() => setCurrentScreen("quiz")}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-300 ${
              currentScreen === "quiz"
                ? isDarkMode
                  ? "text-purple-400 bg-purple-900/30"
                  : "text-purple-600 bg-purple-100"
                : isDarkMode
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Target className="w-6 h-6" />
            <span className="text-xs font-medium">Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 👉 NEW: Progress & History 畫面（Paste - 完整取代舊版）
  // 👉 BEST: Enhanced Progress & Insights Screen
  /* ───── data pools ───── */
    const awarenessFacts = [
      {
        num: "1 in 5",
        txt: "adults in the U.S. experience a mental health issue each year",
      },
      {
        num: "60 %",
        txt: "of athletes don’t track recovery markers like HRV",
      },
      { num: "70 %", txt: "of performance dips link to poor recovery or sleep" },
      {
        num: "50 %",
        txt: "of chronic sleep problems are linked to mental health",
      },
      { num: "2×", txt: "higher injury risk when weekly load spikes >30%" },
    ];
    const knowledgeArticles = [
      {
        tag: "Anxiety Disorders",
        desc: "Symptoms, causes, and coping strategies",
        url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
      },
      {
        tag: "Recovery & Sleep",
        desc: "Sleep, HRV, and fueling to boost recovery",
        url: "https://www.nhs.uk/mental-health/conditions/clinical-depression/overview/",
      },
      {
        tag: "Insomnia",
        desc: "Why you can't sleep and how to fix it",
        url: "https://www.mayoclinic.org/diseases-conditions/insomnia/symptoms-causes",
      },
      {
        tag: " Pre-Game Nerves",
        desc: "Breathwork and routines to steady focus",
        url: "https://www.nimh.nih.gov/health/publications/panic-disorder-index",
      },
      {
        tag: "Overtraining Syndrome",
        desc: "How to spot overtraining and reset your plan",
        url: "https://www.ptsd.va.gov/understand/what/ptsd_basics.asp",
      },
    ];
  const ProgressScreen = () => {
    
// —— Manager Pulse: 問題集（超短、30秒級別）
const pulseQuestions = [
  { id: 1, q: "本週整體情緒氛圍？", a: ["👍 正向", "😐 中性", "👎 負向"] },
  { id: 2, q: "壓力程度？", a: ["低", "中", "高"] },
  { id: 3, q: "團隊連結度（互動/支持）？", a: ["高", "中", "低"] },
];

const [pulseOpen, setPulseOpen] = useState(false);
const [pulseAnswers, setPulseAnswers] = useState({}); // {1: "👍 正向", 2: "中", 3:"高"}
const [submittingPulse, setSubmittingPulse] = useState(false);
//const [coaching, setCoaching] = useState(false);
const [coachTips, setCoachTips] = useState([]);
const [moodTrend, setMoodTrend] = useState([3,3,3,3,3,3,3]);

/*
// 簡單分數映射（MVP：0~100）— 正向/低壓/高連結 = 高分
const scoreMap = {
  "👍 正向": 100, "😐 中性": 60, "👎 負向": 20,
  "低": 90, "中": 60, "高": 30,
  "高": 90, "中": 60, "低": 30,
};
*/
const scoreMap = {
  "👍 positive": 100, "😐 neutral": 60, "👎 negative": 20,
  "low": 90, "medium": 60, "high": 30,
  "high": 90, "medium": 60, "low": 30,
};

const computePulseScore = (answers) => {
  const ids = Object.keys(answers);
  if (ids.length === 0) return 0;
  const sum = ids.reduce((s, id) => s + (scoreMap[answers[id]] || 0), 0);
  return Math.round(sum / ids.length); // 0~100
};

const trend = useMemo(
    () => (Array.isArray(moodTrend) && moodTrend.length ? moodTrend : [0,0,0,0,0,0,0]),
    [moodTrend]
  );

  const moodAvg = useMemo(
    () => trend.reduce((a,b)=>a+b,0) / trend.length,
    [trend]
  );

  const weekDelta = useMemo(() => {
    const first = trend[0];
    const last = trend[trend.length - 1];
    return Number((last - first).toFixed(1));
  }, [trend]);

// 送出 Pulse + 拿 Coach 建議（串後端）
const handleSubmitPulse = async () => {
  const score = computePulseScore(pulseAnswers);
  setSubmittingPulse(true);
  try {
    // 1) 存脈搏結果
    await axios.post("http://127.0.0.1:8000/pulse/submit", {
      teamId: "team-001",
      answers: pulseAnswers,
      score,
    });
    setBanner({ type: "success", msg: `Pulse submitted: ${score}` });

    // 2) 立刻拿教練建議（可選）
    setCoaching(true);
    const { data } = await axios.post("http://127.0.0.1:8000/pulse/coach", {
      teamId: "team-001",
      score,
    });
    setCoachTips(data.tips || []);
    setBanner({ type: "success", msg: "Coaching tips updated" });
    setPulseOpen(false);
  } catch (e) {
    setBanner({ type: "error", msg: "Pulse submit/coach failed" });
  } finally {
    setSubmittingPulse(false);
    setCoaching(false);
  }
};


    

// 風險分數：重新拉資料
const handleRefreshRisk = async () => {
  setLoading(true);
  try {
    const { data } = await api.get("/risk/ella"); // 後端真的有這個端點
    setRiskScore(data.risk_score);                 // 用 risk_score
    setBanner({ type: "success", msg: "Risk updated" });
  } catch (e) {
    setBanner({ type: "error", msg: "Risk fetch failed" });
  } finally {
    setLoading(false);
  }
};

// 匿名告警：送到 HR
const [sendingAlert, setSendingAlert] = useState(false);
const handleSendAlert = async () => {
  setSendingAlert(true);
  try {
    await api.post("/alerts/ella", { allow_alerts: true }); // 開啟匿名告警偏好
    setBanner({ type: "success", msg: "Anonymous risk alerts enabled" });
  } catch {
    setBanner({ type: "error", msg: "Failed to update alert preference" });
  } finally {
    setSendingAlert(false);
  }
};

// 公司趨勢：取最新趨勢
//
const [loadingTrend, setLoadingTrend] = useState(false);
const handleFetchTrend = async () => {
  setLoadingTrend(true);
  try {
    const { data } = await api.get("/org/heatmap");
    // data: { total_users, distribution: { Low, Moderate, High, Severe } }
    // 你畫面上目前顯示 engagement 百分比，可先簡單映射：
    const total = Math.max(1, data.total_users);
    const engagement = Math.round(
      ((data.distribution.Low + data.distribution.Moderate) / total) * 100
    );
    setTrendData({ engagement });
    setBanner({ type: "success", msg: "Trend refreshed" });
  } catch {
    setBanner({ type: "error", msg: "Trend fetch failed" });
  } finally {
    setLoadingTrend(false);
  }
};

// Clinical hub：建立轉介 ticket
const [routing, setRouting] = useState(false);
const handleRouteClinical = async () => {
  setRouting(true);
  try {
    const { data } = await api.post("/route", { user: "ella", score: riskScore });
    // e.g. { ticketId: "TK12345" }
    setBanner({ type: "success", msg: `Routed (ticket ${data.ticketId})` });
  } catch {
    setBanner({ type: "error", msg: "Route failed" });
  } finally {
    setRouting(false);
  }
};

// Manager coaching：拿教練建議
const [coaching, setCoaching] = useState(false);
const handleManagerCoaching = async () => {
  setCoaching(true);
  try {
    const { data } = await api.post("/pulse/coach", { teamId: "team-001" });
    // e.g. { tips: ["Try daily standups", "1:1 check-in"] }
    setBanner({ type: "success", msg: `Tips: ${data.tips?.slice(0,2).join(" • ") || "updated"}` });
  } catch {
    setBanner({ type: "error", msg: "Coaching failed" });
  } finally {
    setCoaching(false);
  }
};

// ISO 報表：下載或開新頁
const [downloading, setDownloading] = useState(false);
const handleDownloadISO = async () => {
  setDownloading(true);
  try {
    const { data } = await api.get("/iso/summary", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement("a");
    a.href = url; a.download = "iso-45003-summary.csv"; a.click();
    window.URL.revokeObjectURL(url);
    setBanner({ type: "success", msg: "ISO report downloaded" });
  } catch {
    setBanner({ type: "error", msg: "Download failed" });
  } finally {
    setDownloading(false);
  }
};


// User profile data
const [userProfile] = useState({
    name: "Alex",
    streak: 7,
    totalSessions: 23,
    improvementScore: 78,
    avatar: "🦋",
  });


  

    /* 隨機取 3 則事實、3 篇文章（只在第一次渲染） */
    const randomFacts = React.useMemo(
      () => awarenessFacts.sort(() => 0.5 - Math.random()).slice(0, 3),
      []
    );
    const randomArticles = React.useMemo(
      () => knowledgeArticles.sort(() => 0.5 - Math.random()).slice(0, 3),
      []
    );


    //import api from "./api";

useEffect(() => {
  api.get(`/risk/ella`)
    .then((res) => setRiskScore(res.data.risk_score ?? res.data.mental_risk_score))
    .catch((err) => console.error("Error fetching risk score", err))
    .finally(() => setLoading(false));
}, []);
    //　≣≣≣ 假資料（之後接 API） ≣≣≣
    //const moodTrend = [3, 4, 2, 4, 5, 3, 4]; // 7d
    //const [moodTrend, setMoodTrend] = useState([3,3,3,3,3,3,3]);

    const energyAvg = 7.2;
    const sleepAvg = 8.1;
    const goals = [
      { g: "Complete 5 mood check-ins", p: 7, t: 5 },
      { g: "Field Training 3 times", p: 2, t: 3 },
      { g: "Connect with 1 teammate", p: 1, t: 1 },
      { g: "Get 7h+ sleep daily", p: 5, t: 7 },
    ];
    const achievements = [
      {
        icon: "🔥",
        t: "7-Day Streak!",
        d: "Consistent daily check-ins",
        date: "Today",
        done: true,
      },
      {
        icon: "💪",
        t: "Burned Out Management",
        d: "Improved coping strategies",
        date: "2 days ago",
        done: true,
      },
      {
        icon: "🌟",
        t: "Performance State Improvement",
        d: "3 consecutive good days",
        date: "3 days ago",
        done: true,
      },
      {
        icon: "📚",
        t: "Assessment Expert",
        d: "Complete 3 assessments",
        date: "In progress",
        done: false,
      },
    ];
    // FeatureRow：新增 actions 支援
const FeatureRow = ({
  Icon, title, description, value = null, progress = null,
  status = "active", delay = 0,
  actions = [] // ← [{label, onClick, kind:'primary'|'ghost', loading}]
}) => {
  const statusStyle =
    status === "active"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      : status === "warning"
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";

  return (

    



    <div
      className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-white/70 to-white/30 dark:from-slate-800/60 dark:to-slate-700/40 border border-slate-200/60 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-500"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800 dark:text-white">{title}</div>
            {value !== null && (
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {value}
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>{status.toUpperCase()}</span>
          {/* actions */}
          <div className="flex gap-2">
            {actions.map((a, idx) => (
              <button
                key={idx}
                onClick={a.onClick}
                disabled={a.loading}
                className={
                  a.kind === "ghost"
                    ? "px-3 py-1.5 rounded-lg border text-sm dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    : "px-3 py-1.5 rounded-lg text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-60"
                }
              >
                {a.loading ? "..." : a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {typeof progress === "number" && (
        <div className="mt-4 w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              title.includes("Risk")
                ? "bg-gradient-to-r from-yellow-400 to-red-500"
                : "bg-gradient-to-r from-green-400 to-blue-500"
            }`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
    </div>


  
  );
};

// —— 新增：這兩個小狀態給條列卡片用 —— 
const [activeAlerts] = useState(2);
//const [trendData] = useState({ engagement: 78, improvement: 15 });
const [trendData, setTrendData] = useState({ engagement: 78, improvement: 15 });
// —— 新增：支援按鈕的 API 呼叫（用你現成的 banner / isConnecting 狀態）——
const handleGetHelp = async () => {
  setIsConnecting(true);
  try {
    await api.post("/chat", { user_id: "ella", message: "help request" });
    setBanner({ type: "success", msg: "Help request submitted confidentially" });
  } catch {
    setBanner({ type: "error", msg: "Failed to submit help request" });
  } finally {
    setIsConnecting(false);
  }
};
    /* —————————————————— UI —————————————————— */
    return (
      <div
        className={`min-h-screen ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-900 to-indigo-900"
            : "bg-gradient-to-br from-purple-50 to-indigo-100"
        } pb-24 overflow-x-hidden`}
      >
        {/* Header */}
        <div
          className={`${
            isDarkMode ? "bg-slate-800/90" : "bg-white/90"
          } backdrop-blur border-b ${
            isDarkMode ? "border-slate-700" : "border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between p-4">
            {/* back */}
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className={`p-2 rounded-xl ${
                isDarkMode ? "hover:bg-slate-700" : "hover:bg-purple-100"
              } transition`}
            >
              <ChevronRight
                className={`w-5 h-5 rotate-180 ${
                  isDarkMode ? "text-slate-400" : "text-purple-600"
                }`}
              />
            </button>

            {/* title */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-xl font-bold tracking-wide ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Your Progress
              </h1>
            </div>

            {/* CTA */}
            <button
              onClick={() => setCurrentScreen("quiz")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-transform hover:-translate-y-1"
            >
              Take Assessment
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-8 animate-fadeSlide">
          {/* — WEEKLY KPI — */}
          <div
            className={`${
              isDarkMode ? "bg-slate-800/70" : "bg-white/90"
            } backdrop-blur p-6 rounded-3xl border ${
              isDarkMode ? "border-slate-600" : "border-purple-200"
            } shadow-xl`}
          >
            {/* title row */}
            <div className="flex items-center justify-between mb-8">
              <h3
                className={`text-2xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                📈 This Week’s Highlights
              </h3>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <span
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                >
                  +12%
                </span>
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {/* Streak */}
              <KpiCard
                label="Day Streak"
                value={userProfile.streak}
                color="green"
                icon={<Trophy className="w-5 h-5 text-yellow-400" />}
              />
              {/* Sessions */}
              <KpiCard
                label="Sessions"
                value={userProfile.totalSessions}
                color="blue"
                icon={<Zap className="w-5 h-5 text-cyan-300" />}
              />
              {/* Wellness */}
              <KpiCard
                label="Wellness (%)"
                value={userProfile.improvementScore}
                color="purple"
                icon={<BarChart3 className="w-5 h-5 text-purple-300" />}
              />
            </div>
          </div>

          {/* — TREND CHART — */}
          <div
            className={`${
              isDarkMode ? "bg-slate-800/70" : "bg-white/90"
            } backdrop-blur p-6 rounded-3xl border ${
              isDarkMode ? "border-slate-600" : "border-purple-200"
            } shadow-xl`}
          >
            <p className={`${isDarkMode ? "text-slate-300" : "text-gray-600"} text-sm mb-2`}>
  Weekly summary: avg {moodAvg.toFixed(1)}/5 {weekDelta >= 0 ? "↑" : "↓"}{Math.abs(weekDelta)} vs. start; watch sleep & energy.
</p>
            <h3
              className={`text-xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              📊 7-Day Performance State Trend
            </h3>

            <LineChart values={moodTrend} dark={isDarkMode} />

            {/* mini rings */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <MiniRing
                label="Avg Performance State"
                value={
                  (moodTrend.reduce((a, b) => a + b) / moodTrend.length) * 20
                }
                color="purple"
              />
              <MiniRing label="Energy" value={energyAvg * 10} color="cyan" />
              <MiniRing label="Sleep" value={sleepAvg * 10} color="pink" />
            </div>
          </div>

          {/* — ACHIEVEMENTS — */}
          <SectionCard title="🏆 Recent Achievements">
            {achievements.map((a, i) => (
              <AchievementRow key={i} data={a} dark={isDarkMode} />
            ))}
          </SectionCard>

          {/* — GOALS — */}
          <SectionCard title="🎯 Weekly Goals">
            {goals.map((g, i) => (
              <GoalRow key={i} data={g} dark={isDarkMode} />
            ))}
          </SectionCard>
        </div>

        {/* local styles */}
        <style jsx>{`
          @keyframes fadeSlide {
            0% {
              opacity: 0;
              transform: translateY(32px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeSlide {
            animation: fadeSlide 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes dash {
            to {
              stroke-dashoffset: 0;
            }
          }
          .animate-dash {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
            animation: dash 2s ease-in-out forwards;
          }
        `}</style>
        {/* ───── Awareness ───── */}
        <div
          className={`${
            isDarkMode ? "bg-sky-800/60" : "bg-sky-50"
          } backdrop-blur p-6 rounded-3xl border ${
            isDarkMode ? "border-sky-600" : "border-sky-200"
          } shadow-xl mt-10 space-y-4`}
        >
          <h3
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } flex items-center gap-2`}
          >
            🌿Performance Awareness


          </h3>

          {/* random fact cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {randomFacts.map((s, i) => (
              <div
                key={i}
                className={`${
                  isDarkMode ? "bg-sky-900/40" : "bg-white/60"
                } p-4 rounded-2xl text-center`}
              >
                <div className="text-3xl font-extrabold text-sky-400 mb-1">
                  {s.num}
                </div>
                <p className="text-xs leading-snug text-slate-400">{s.txt}</p>
              </div>
            ))}
          </div>

          <p
            className={`text-sm ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Early load management and smart recovery prevent most dips. Explore the knowledge base to sharpen your game.
          </p>

          <button
            onClick={() => setCurrentScreen("awareness")}
            className="px-6 py-3 w-full sm:w-auto rounded-2xl font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-90 transition"
          >
            🔵 Read More
          </button>
        </div>

        {/* ───── Knowledge Base Shortcut ───── */}
        <div
          className={`${
            isDarkMode ? "bg-purple-800/60" : "bg-purple-50"
          } backdrop-blur p-6 rounded-3xl border ${
            isDarkMode ? "border-purple-600" : "border-purple-200"
          } shadow-xl mt-10`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-800"
              } flex items-center gap-2`}
            >
              📚 Knowledge Base
            </h3>
            <button
              onClick={() => setCurrentScreen("knowledge")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold hover:opacity-90 transition"
            >
              View All
            </button>
          </div>

          {/* random article buttons */}
          <div className="space-y-3">
            {randomArticles.map((a, idx) => (
              <a
                key={idx}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${
                  isDarkMode
                    ? "bg-purple-900/30 hover:bg-purple-800/40"
                    : "bg-white/70 hover:bg-white/90"
                } 
                    w-full block text-left p-4 rounded-2xl transition duration-300`}
              >
                <div className="font-semibold text-purple-400">{a.tag}</div>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-slate-300" : "text-gray-600"
                  }`}
                >
                  {a.desc}
                </p>
              </a>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={() => setCurrentScreen("knowledge")}
              className={`px-4 py-2 rounded-xl transition
              ${isDarkMode
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-purple-100 text-purple-600 hover:bg-purple-200"}`}
            >
              View All
            </button>
          </div>

      {/*
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4">
  {[
    {
      icon: <Brain className="text-purple-500 w-6 h-6" />,
      title: "Mental Risk Score",
      desc: "Analyze mood, energy, and chat sentiment to detect early signs of mental health risk."
    },
    {
      icon: <AlertTriangle className="text-yellow-500 w-6 h-6" />,
      title: "Anonymous Risk Alerts",
      desc: "Opt-in to send anonymous alerts to HR if high-risk patterns are detected."
    },
    {
      icon: <TrendingUp className="text-indigo-500 w-6 h-6" />,
      title: "Org Trend Dashboard",
      desc: "View anonymized company-wide mental health trends and wellness engagement rates."
    },
    {
      icon: <Heart className="text-pink-500 w-6 h-6" />,
      title: "Clinical Hub",
      desc: "Automatically route employees to internal counselors or EAP networks based on risk level."
    },
    {
      icon: <Users className="text-blue-500 w-6 h-6" />,
      title: "Manager Pulse + Coaching",
      desc: "Weekly 30s surveys + instant coaching tips for leadership based on team emotion."
    },
    {
      icon: <CheckCircle className="text-green-500 w-6 h-6" />,
      title: "ISO 45003 Metrics",
      desc: "Optional dashboard for analyzing compliance with ISO workplace mental health standards."
    }
  ].map((card, i) => (
    <motion.div
      key={i}
      className="p-5 rounded-2xl border shadow-md bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-500"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center mb-3 gap-2">
        {card.icon}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {card.title}
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{card.desc}</p>
    </motion.div>
  ))}

  {/* CTA Button }
  <motion.div
    className="col-span-1 sm:col-span-2 lg:col-span-3 text-center p-6 rounded-2xl border shadow-md bg-white dark:bg-slate-800"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
  >
    <ClipboardList className="mx-auto mb-3 text-red-500 w-6 h-6" />
    <button
      className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-full font-semibold transition"
      onClick={() => {
        axios
          .post("http://127.0.0.1:8000/help", { user: "ella" })
          .then(() => alert("Help request sent anonymously!"))
          .catch(() => alert("Failed to send help request."));
      }}
    >
      Get Help Now
    </button>
    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
      Connect to your internal counselor or submit an HR support request.
    </p>
  </motion.div>

      </div>
        </div> 
        */}
{/* —— 新條列式 Dashboard（取代原本的六宮格）—— */}
<div className="space-y-4 mt-10">
  <FeatureRow
  Icon={Brain}
  title="Performance Risk Score"
  description=" AI analysis of performance state, stamina, and communication patterns to flag early overload risks."
  value={riskScore}
  progress={riskScore}
  status={riskScore < 30 ? "active" : riskScore < 60 ? "warning" : "critical"}
  actions={[
    { label: "Refresh", onClick: handleRefreshRisk },
    { label: "Details", onClick: () => setCurrentScreen("quiz"), kind: "ghost" },
  ]}
/>

<FeatureRow
  Icon={AlertTriangle}
  title="Anonymous Risk Alerts"
  description="Privacy-first alerts that notify coaching staff of concerning trends while keeping athletes anonymous."
  value={2}
  progress={2 * 10}
  actions={[
    { label: "Send Alert", onClick: handleSendAlert, loading: sendingAlert },
  ]}
/>

<FeatureRow
  Icon={TrendingUp}
  title="Team Trend Dashboard"
  description="Real-time view of team-wide readiness and engagement rates."
  value={`${trendData.engagement}%`}
  progress={trendData.engagement}
  actions={[
    //{ label: "Refresh", onClick: handleFetchTrend, loading: loadingTrend },
    //{ label: "Open", onClick: () => setCurrentScreen("progress"), kind: "ghost" },
    { label: "Refresh", onClick: handleOpenOrgTrend }, // 也能同時 refresh
    { label: "Open", onClick: handleOpenOrgTrend, kind: "ghost" },
  ]}
/>

<FeatureRow
  Icon={Heart}
  title="Clinical Hub"
  description="Smart routing that connects athletes to coaches, physios, or support resources based on risk level."
  actions={[
    { label: "Route Me", onClick: handleRouteClinical, loading: routing },
  ]}
/>

<FeatureRow
  Icon={Users}
  title="Coach Pulse + Tips"
  description="Weekly micro-checks plus instant coaching suggestions based on team signals."
  actions={[
    { label: "Get Tips", onClick: handleManagerCoaching, loading: coaching },
  ]}
/>

<FeatureRow
  Icon={CheckCircle}
  title="Team Metrics (ISO 45003 mapping)"
  description="Auto-generated metrics mapped to well-being standards—export anytime."
  actions={[
    { label: "Download CSV", onClick: handleDownloadISO, loading: downloading },
  ]}
/>


  {/* —— 緊急支援 CTA —— */}
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 p-8 text-center text-white shadow-2xl">
    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-pink-600/20 to-purple-700/20 animate-pulse" />
    <div className="relative z-10">
      <ClipboardList className="w-12 h-12 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2">Need Immediate Support?</h3>
      <p className="opacity-90 max-w-2xl mx-auto mb-6">
        Connect instantly with your internal counselor or submit a confidential HR support request.
      </p>
      <button
        onClick={handleGetHelp}
        disabled={isConnecting}
        className={`px-6 py-3 rounded-full font-bold bg-white text-red-600 hover:bg-gray-50 transition ${
          isConnecting ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {isConnecting ? "Sending..." : "Get Help Now"}
      </button>
      <div className="mt-4 text-sm opacity-90 flex flex-col sm:flex-row gap-2 justify-center">
        <span>100% Confidential</span> <span className="hidden sm:inline">•</span>
        <span>24/7 Support Available</span> <span className="hidden sm:inline">•</span>
        <span>Response in 24hrs</span>
      </div>
    </div>
  </div>
</div>

      </div>

      </div>
    );
  };

  /* —————————— 便利小元件 —————————— */
  const KpiCard = ({ label, value, color, icon }) => (
    <div className="flex items-center p-4 bg-gradient-to-br from-white/10 to-white/0 rounded-2xl border border-white/10 shadow-inner">
      <div
        className={`w-10 h-10 mr-4 rounded-2xl flex items-center justify-center bg-${color}-500/20`}
      >
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );

  const LineChart = ({ values, dark }) => {
    // map values 1-5 to svg y 30-2
    const pts = values.map((v, i) => `${i * 15},${32 - (v - 1) * 7}`).join(" ");
    return (
      <svg viewBox="0 0 90 40" className="w-full h-40">
        <defs>
          <linearGradient id="strokeGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={dark ? "#c084fc" : "#a855f7"} />
            <stop offset="100%" stopColor={dark ? "#818cf8" : "#7dd3fc"} />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor={dark ? "#7c3aed" : "#c084fc"}
              stopOpacity="0.25"
            />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polyline
          points={pts}
          fill="none"
          stroke="url(#strokeGrad)"
          strokeWidth="2"
          className="animate-dash"
          strokeLinecap="round"
        />
        <polygon points={`${pts} 90,40 0,40`} fill="url(#fillGrad)" />
      </svg>
    );
  };

  const MiniRing = ({ label, value, color, dark }) => {
    const palette = {
      purple: { light: "#c084fc", dark: "#a855f7" },
      cyan: { light: "#7dd3fc", dark: "#22d3ee" },
      pink: { light: "#f9a8d4", dark: "#ec4899" },
    };
    const col = palette[color] || palette.purple;

    return (
      <div className="flex items-center space-x-4">
        <svg width="48" height="48" className="-rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            strokeWidth="4"
            stroke={col.light}
            className="opacity-20"
            fill="none"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            strokeWidth="4"
            strokeLinecap="round"
            stroke={`url(#ring-${color})`}
            fill="none"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (value / 100) * 125.6}
            className="transition-[stroke-dashoffset] duration-1000"
          />
          <defs>
            <linearGradient id={`ring-${color}`} x1="1" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={col.light} />
              <stop offset="100%" stopColor={col.dark} />
            </linearGradient>
          </defs>
        </svg>

        <div>
          <div
            className={`text-sm font-bold ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            {label}
          </div>
          <div
            className={`text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}
          >
            {Math.round(value)}%
          </div>
        </div>
      </div>
    );
  };

  const AchievementRow = ({ data, dark }) => (
    <div
      className={`flex items-center space-x-4 p-4 rounded-2xl ${
        data.done
          ? dark
            ? "bg-green-900/30 border border-green-700"
            : "bg-green-50 border border-green-200"
          : dark
          ? "bg-slate-700/50 border border-slate-600"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <div className="text-3xl">{data.icon}</div>
      <div className="flex-1">
        <h4 className={`font-bold ${dark ? "text-white" : "text-gray-800"}`}>
          {data.t}
        </h4>
        <p className={`text-xs ${dark ? "text-slate-400" : "text-gray-600"}`}>
          {data.d}
        </p>
      </div>
      <div className="text-right">
        {data.done ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Clock
            className={`w-5 h-5 ${dark ? "text-slate-400" : "text-gray-400"}`}
          />
        )}
        <p
          className={`text-[10px] mt-1 ${
            dark ? "text-slate-500" : "text-gray-500"
          }`}
        >
          {data.date}
        </p>
      </div>

    </div>
  );

  const GoalRow = ({ data, dark }) => {
    const pct = Math.min((data.p / data.t) * 100, 100);
    return (
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              dark ? "text-white" : "text-gray-800"
            }`}
          >
            {data.g}
          </span>
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs ${dark ? "text-slate-400" : "text-gray-600"}`}
            >
              {data.p}/{data.t}
            </span>
            {pct === 100 && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
        </div>
        <div
          className={`${
            dark ? "bg-slate-700" : "bg-gray-200"
          } h-2 rounded-full`}
        >
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              pct === 100
                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                : "bg-gradient-to-r from-blue-400 to-cyan-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const SectionCard = ({ title, children }) => (
    <div
      className={`${
        isDarkMode ? "bg-slate-800/70" : "bg-white/90"
      } backdrop-blur p-6 rounded-3xl border ${
        isDarkMode ? "border-slate-600" : "border-purple-200"
      } shadow-xl`}
    >
      <h3
        className={`text-xl font-bold mb-6 ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}
      >
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
  // 👉 UPGRADED Self-Assessment (paste over old)
  const QuizScreen = () => {
    const currentQ = quizQuestions[currentQuestionIndex];

    const handleAnswer = (optIdx) => {
      setQuizAnswers({ ...quizAnswers, [currentQ.id]: optIdx });
    };

    const next = async () => {
  if (currentQuestionIndex < quizQuestions.length - 1) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  } else {
    // 提交到真實 API 進行分析


    const result = await submitAssessment(quizAnswers);
    
    if (result.error) {
  setBanner({ type: "error", msg: `Assessment API failed: ${result.error}` });
} else {
  setBanner({ type: "success", msg: "Assessment completed ✔" });
  setAssessmentScore(result.score);
  setQuizCompleted(true);
  setCurrentScreen("quiz-results");
}
  }
};

    /* 進度百分比 */
    const pct = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
      <div
        className={`min-h-screen ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-900 to-indigo-900"
            : "bg-gradient-to-br from-purple-50 to-indigo-100"
        } flex flex-col pb-24`}
      >
        {/* Header */}
        <div
          className={`${
            isDarkMode ? "bg-slate-800/90" : "bg-white/90"
          } backdrop-blur border-b ${
            isDarkMode ? "border-slate-700" : "border-purple-200"
          }`}
        >
          <div className="flex items-center p-4">
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className={`p-2 rounded-xl ${
                isDarkMode ? "hover:bg-slate-700" : "hover:bg-purple-100"
              } transition`}
            >
              <ChevronRight
                className={`w-5 h-5 rotate-180 ${
                  isDarkMode ? "text-slate-400" : "text-purple-600"
                }`}
              />
            </button>
            <Target className="w-6 h-6 text-purple-500 ml-2" />
            <h1
              className={`text-lg font-bold ml-2 ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Self-Assessment
            </h1>
          </div>

          {/* TOP progress bar */}
          <div
            className={`h-2 w-full ${
              isDarkMode ? "bg-slate-700" : "bg-purple-200/50"
            }`}
          >
            <div
              className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Question zone */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-hidden">
          <div key={currentQ.id} className="space-y-8 animate-fadeSwap">
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Question {currentQuestionIndex + 1}
              </h2>
              <span
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-gray-500"
                }`}
              >
                {currentQ.category}
              </span>
            </div>

            <p
              className={`text-lg leading-relaxed ${
                isDarkMode ? "text-slate-300" : "text-gray-700"
              }`}
            >
              {currentQ.question}
            </p>

            {/* Options */}
            <div className="space-y-4">
              {currentQ.options.map((opt, idx) => {
                const selected = quizAnswers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full text-left p-5 rounded-2xl border flex items-center space-x-4 transition-all duration-300 ${
                      selected
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl scale-105"
                        : isDarkMode
                        ? "bg-slate-800/70 border-slate-600 text-slate-200 hover:bg-slate-700/70"
                        : "bg-white/90 border-purple-200 text-gray-800 hover:bg-purple-50"
                    }`}
                  >
                    {selected ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <span className="w-5 h-5 flex-shrink-0 border-2 rounded-full border-current"></span>
                    )}
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next / Finish */}
          <button
            onClick={next}
            disabled={quizAnswers[currentQ.id] === undefined}
            className={`mt-8 w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 flex items-center justify-center gap-2 disabled:opacity-40`}
          >
            {currentQuestionIndex === quizQuestions.length - 1 ? (
              <>
                Finish
                {/* pulse dot */}
                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
              </>
            ) : (
              "Next"
            )}
          </button>
        </div>

        {/* local animation */}
        <style jsx>{`
          @keyframes fadeSwap {
            0% {
              opacity: 0;
              transform: translateY(24px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeSwap {
            animation: fadeSwap 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        `}</style>
      </div>
    );
  };

  // 👉 ELITE Mental-Wellness Result
  // 👉 ULTRA Calm Wellness Result
  const QuizResultsScreen = () => {
    /* ============= 評分與動態內容 ============= */
    const maxScore = quizQuestions.length * 4;
const pct = Math.round((assessmentScore / maxScore) * 100);

let badge = { label: "", color: "", subtitle: "" };
if (pct < 20) {
  badge = { label: "Elite", color: "emerald", subtitle: "Locked in—keep rolling ✨" };
} else if (pct < 40) {
  badge = { label: "Game Ready", color: "sky", subtitle: "Solid baseline—nice balance 💙" };
} else if (pct < 60) {
  badge = { label: "Building", color: "amber", subtitle: "Small tune-ups will help 🌿" };
} else if (pct < 80) {
  badge = { label: "Overloaded", color: "rose", subtitle: "Smart move—let’s reset 💚" };
} else {
  badge = { label: "Needs Support", color: "red", subtitle: "Your coach has your back 🫂" };
}

/* Recommendations — keep icons to ones already imported to avoid build errors */
const recs = [
  {
    icon: "Activity",
    title: "Active Recovery & Fresh Air",
    tag: "Recovery",
    impact: "High Impact",
    text:
      "20 minutes of easy walk or cycle outdoors. Light aerobic work plus fresh air calms the nervous system and speeds recovery.",
  },
  {
    icon: "Activity",
    title: "Fueling & Hydration Routine",
    tag: "Nutrition",
    impact: "Medium Impact",
    text:
      "Limit caffeine after 2 PM, add electrolytes post-session, and include omega-3 sources (salmon, walnuts) to support recovery.",
  },
  {
    icon: "Activity",
    title: "Pre-Game Breathwork",
    tag: "Focus",
    impact: "High Impact",
    text:
      "Try 5 minutes of box breathing (4-4-4-4) or a 4/6 cadence before practice to steady focus and reduce jitters.",
  },
];


    /* palette 映射 */
    const tone = {
      emerald: { bg: "#34d399", shadow: "#064e3b" },
      sky: { bg: "#38bdf8", shadow: "#0c4a6e" },
      amber: { bg: "#fbbf24", shadow: "#78350f" },
      rose: { bg: "#fb7185", shadow: "#881337" },
      red: { bg: "#ef4444", shadow: "#7f1d1d" },
    }[badge.color];

    /* 小工具：Icon 動態載入 */
    const LucideIcon = ({ name, className }) => {
      const icons = { Activity, Heart, Sparkles };
      return React.createElement(icons[name] || Heart, { className });
    };

    return (
      <div
        className={`min-h-screen flex flex-col items-center ${
          isDarkMode
            ? "bg-gradient-to-br from-[#2b2d55] to-[#5b5ec8]"
            : "bg-gradient-to-br from-purple-100 to-indigo-200"
        } pb-28`}
      >
        {/* 彩色氣泡裝飾 */}
        <div className="absolute top-0 inset-x-0 flex justify-center mt-6 pointer-events-none select-none">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-rose-300/70 blur-2xl animate-pulse" />
            <Heart className="absolute inset-0 m-auto w-9 h-9 text-white" />
            <Sparkles className="absolute -top-3 -right-3 w-9 h-9 text-pink-300 rotate-12" />
          </div>
        </div>

        {/* 主卡片 */}
        <div
          className={`w-full max-w-3xl mx-auto mt-40 ${
            isDarkMode ? "bg-[#0f172a]/70" : "bg-white/90"
          } backdrop-blur-xl rounded-[32px] p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] animate-fadeDrop`}
        >
          {/* 標題 */}
          <h1
            className="text-center text-3xl font-extrabold tracking-wide
                       bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent"
          >
            Your Performance Grade Profile
          </h1>

          {/* 等級 Badge */}
          <div className="mt-10 flex flex-col items-center">
            <span
              className="px-6 py-3 rounded-full text-sm font-semibold text-white"
              style={{
                background: tone.bg,
                boxShadow: `0 0 10px ${tone.shadow}`,
              }}
            >
              {badge.label}
            </span>
            <p className="mt-3 text-sm text-green-400">{badge.subtitle}</p>
          </div>

          {/* 線性評分條 */}
          <div className="mt-10 space-y-1">
            <div className="flex items-center justify-between text-xs text-indigo-400">
              <span>Your Assessment Score</span>
              <span>
                {assessmentScore} / {maxScore}
              </span>
            </div>
            <div className="h-4 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-4 bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Thriving</span>
              <span>Balanced</span>
              <span>Needs Support</span>
            </div>
          </div>

          {/* Coach note */}
<div
  className="mt-8 rounded-3xl bg-gradient-to-br from-emerald-300/40 via-transparent to-pink-300/40 p-6 text-sm
              text-emerald-950 dark:text-emerald-200"
>
  {pct >= 60
    ? "Your responses suggest signs of overload. That’s okay—backing off is a winning move. Consider a short recovery block and talk with your coach for a tailored plan."
    : "You’re trending well. Keep core habits consistent and watch for early fatigue signals—maintenance beats repair."}
</div>

{/* Personalized plan */}
<h2 className="mt-14 flex items-center justify-center gap-2 font-bold text-xl text-indigo-400">
  <Activity className="w-5 h-5" /> Your Personalized Performance Plan
</h2>
<p className="text-center text-sm text-slate-400 mb-8">
  Evidence-based recommendations crafted just for you ✨
</p>


          <div className="space-y-4">
            {recs.map((r, i) => (
              <div
                key={i}
                className={`p-5 bg-white/80 dark:bg-slate-800/70 rounded-2xl flex space-x-4 shadow
                                      hover:shadow-lg transition group`}
              >
                {/* icon 彩色方塊 */}
                <div
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/0
                              flex items-center justify-center shrink-0 backdrop-blur"
                >
                  <LucideIcon
                    name="Activity"
                    className="w-5 h-5 text-emerald-400"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-indigo-500 group-hover:underline">
                      {r.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-600">
                      {r.tag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-medium text-emerald-600">
                      {r.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {r.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 行動按鈕 */}
          <div className="mt-10 flex flex-col sm:flex-row sm:justify-center gap-4">
            <button
              onClick={() => setCurrentScreen("chat")}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-400/60 backdrop-blur
                       text-white font-semibold hover:bg-emerald-400 transition"
            >
              <Heart className="w-4 h-4" /> Continue Your Journey with Motin
            </button>
            <button
              onClick={() => {
                setQuizAnswers({});
                setCurrentQuestionIndex(0);
                setCurrentScreen("quiz");
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 dark:bg-slate-700/70
                       text-indigo-500 font-semibold hover:bg-white/90 dark:hover:bg-slate-600 transition"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Retake Assessment
            </button>
          </div>

          {/* Crisis box */}
<div
  className="mt-14 rounded-3xl p-8
    bg-gradient-to-br
    from-blue-500/90
    to-pink-500/90
    text-center
    space-y-6"
>
  <h3 className="font-bold text-lg text-white flex items-center justify-center gap-2">
    <Heart className="w-5 h-5" /> You’re Not Alone
  </h3>
  <p className="text-xs text-white/90 leading-relaxed max-w-xs mx-auto">
    Reaching out shows courage. These resources are here to keep you safe and supported.
    They complement—never replace—professional care.
  </p>
  <div className="flex justify-center gap-8">
    <SupportItem
      icon="Phone"
      label="Crisis Support"
      text="Call 988 (US)"
    />
    <SupportItem
      icon="MessageSquare"
      label="Text Support"
      text="Text HOME to 741741"
    />
    <SupportItem
      icon="Activity"
      label="Emergency"
      text="Call 911"
    />
  </div>
</div>
        </div>

        {/* 動畫 */}
        <style jsx>{`
          @keyframes fadeDrop {
            0% {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-fadeDrop {
            animation: fadeDrop 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        `}</style>
      </div>
    );
  };

  /* 小元件 – Crisis支援按鈕 */
  const SupportItem = ({ icon, label, text }) => {
    const Icon = { Phone, MessageSquare, Activity }[icon] || Phone;
    return (
      <div className="text-white text-xs space-y-1">
        <Icon className="w-6 h-6 mx-auto" />
        <div className="font-semibold">{label}</div>
        <div>{text}</div>
      </div>
    );
  };

  // Main render function
  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen />;
      case "dashboard":
        return <Dashboard />;
      case "chat":
        return <ChatScreen />;
      case "community":
        return <CommunityScreen />;
      case "progress":
        return <ProgressScreen />;
      case "quiz":
        return <QuizScreen />;
      case "quiz-results":
        return <QuizResultsScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    
     
    <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
      {/* === 🎵 Hidden BGM player (auto-plays & loops) === */}
    
    <audio ref={audioRef} src="/guitarmusic.mp3" loop preload="auto" hidden />

    

      {banner && (
  <div
    className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg
      ${banner.type === "success"
        ? "bg-emerald-500 text-white"
        : "bg-rose-500 text-white"}`}
  >
    {banner.msg}
  </div>
)}
      {renderScreen()}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  
  
  );
};
//};
  
export default PsyMuse;
