const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";
let pendingNumericConfirm = false;

// ✅ 대화 기록 (이게 핵심)
let messages = [];

// 화면 전환
function go(mode) {
  currentMode = mode;
  messages = [];
  pendingNumericConfirm = false;

  document.getElementById("home").style.display = "none";
  document.getElementById("chat").style.display = "block";

  const startMessage =
    mode === "mood"
      ? "오늘 기분은 어떠신가요?"
      : mode === "health"
      ? "오늘 건강 상태를 말씀해주세요."
      : "보호자에게 어떤 메시지를 전달할까요?";

  addMessage("assistant", startMessage);
}

function backHome() {
  document.getElementById("chat").style.display = "none";
  document.getElementById("home").style.display = "block";
  document.getElementById("chatLog").innerHTML = "";
  messages = [];
  pendingNumericConfirm = false;
}

function addMessage(role, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = role === "assistant" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // ✅ 메시지 히스토리 저장
  messages.push({ role, content: text });

  // 숫자 확인 단계 진입
  if (role === "assistant" && text.includes("제가 이렇게 들었어요")) {
    pendingNumericConfirm = true;
  }
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        messages,                // ✅🔥 이 줄이 모든 문제의 해답
        mode: currentMode,
        pendingNumericConfirm,   // 상태 전달
      }),
    });

    const data = await res.json();
    addMessage("assistant", data.reply || "응답이 없습니다.");

  } catch (err) {
    addMessage("assistant", "서버 연결 오류가 발생했습니다.");
  }
}
