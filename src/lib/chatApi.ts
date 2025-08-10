import axios from "axios";
import { io, Socket } from "socket.io-client";

const API = import.meta.env.VITE_API_BASE!;          // 例: https://psy-backend.fly.dev
const WS  = import.meta.env.VITE_WS_BASE  || API;    // 若 ws 與 http 同網域

export type ChatMsg = {
  id: string;              // 後端生成
  sender: "user" | "dr-muse";
  content: string;
  ts: string;              // ISO8601
};

/* 取得歷史訊息 */
export async function fetchChatHistory(userId: string) {
  const { data } = await axios.get<ChatMsg[]>(`${API}/api/chat/history/${userId}`);
  return data;
}

/* 送出訊息（REST fall-back；成功回傳 server 轉存之訊息） */
export async function sendChat(text: string, userId: string) {
  const { data } = await axios.post<ChatMsg>(`${API}/api/chat/send`, { text, userId });
  return data;
}

/* 建立 WS 連線，回傳 <socket, disconnect()>  */
export function openChatSocket(userId: string) {
  const socket: Socket = io(`${WS}/ws/chat`, { query: { userId } });

  /** 讓呼叫端掛 listener：socket.on("chat", (msg:ChatMsg)=>{}) */
  return socket;
}
