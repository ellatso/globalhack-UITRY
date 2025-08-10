// src/api.js
/*
import axios from "axios";

export default axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
*/
/*
import axios from "axios";

// 兼容 Vite / CRA / 最後退回預設
const VITE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000"; // fallback

const API_BASE = VITE_URL.replace(/\/$/, ""); // 去掉尾巴的斜線

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 20000,
});

export default api;

*/
import axios from "axios";
const VITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000";
const api = axios.create({ baseURL: `${VITE_URL.replace(/\/$/, "")}/api`, timeout: 20000 });
export default api;