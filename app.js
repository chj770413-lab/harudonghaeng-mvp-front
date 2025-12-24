const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// ✅ 숫자 확인 상태
let pendingNumericConfirm = false;
let heardNumber = null;

// ✅ 세션 흐름 상태 (핵심)
let sessionFlow = "free"; // "free" | "numeric"

// ✅ 대화 히스토리
let chatHistory = [];

// =====================
// 화면 전환
// =====================
function go(mode) {
  currentMode = mode;
  document.getElementById("home").style.display = "none";
  document.getElementById("chat").style.display = "block";

  const startMessage =
    mode === "mood"
      ? "오늘 기분은 어떠신가요?"
      : mode === "health"
      ? "오늘 건강 상태를 말씀해주세요."
      : "보호자에게 어떤 메시지를 전달할까요?";

  addMessage("bot", startMessage);
}

function backHome() {
  document.getElementById("chat").style.display = "none";
  document.getElementById("home").style.display = "block";
  document.getElementById("chatLog").innerHTML = "";

  // ✅ 초기화
  pendingNumericConfirm = false;
  heardNumber = null;
  sessionFlow = "free";
  chatHistory = [];
}

// =====================
// 메시지 출력 + 히스토리
// =====================
function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  chatHistory.push({
    role: who === "bot" ? "assistant" : "user",
    content: text,
  });
}

// =====================
// confirmAction 결정
// =====================
function resolveConfirmAction(text) {
  const t = text.trim();

  if (/^(맞아|응 맞아|응|네)$/.test(t)) return "yes";
  if (/^(아니야|아니)$/.test(t)) return "no";

  return null;
}

// =====================
// 메시지 전송
// =====================
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // =====================
  // 🔴 숫자 확인 단계
  // =====================
  if (pendingNumericConfirm) {
    const action = resolveConfirmAction(text);

    if (!action) {
      addMessage("bot", "맞으면 '맞아', 아니면 '아니야'라고 해주세요.");
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageType: "numericConfirm",
        pendingNumericConfirm: true,
        heardNumber: heardNumber,
        confirmAction: action,
        mode: currentMode,
        sessionFlow, // 🔒 numeric 유지
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply);

    // 서버가 다시 확인 요청하면 유지
    pendingNumericConfirm = data.needConfirm === true;
    if (data.needConfirm && data.heardNumber) {
      heardNumber = data.heardNumber;
      sessionFlow = "numeric";
    }

    // 설명 완료 시 흐름 해제
    if (data.sessionFlow === "free") {
      sessionFlow = "free";
      pendingNumericConfirm = false;
      heardNumber = null;
    }

    return;
  }

  // =====================
  // 🔵 일반 메시지
  // =====================
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      pendingNumericConfirm: false,
      heardNumber: null,
      mode: currentMode,
      sessionFlow, // 🔒 free 상태 전달
    }),
  });

  const data = await res.json();
  addMessage("bot", data.reply);

  // =====================
  // 서버가 숫자 확인 요청 시
  // =====================
  if (data.needConfirm && data.heardNumber) {
    pendingNumericConfirm = true;
    heardNumber = data.heardNumber;
    sessionFlow = "numeric"; // 🔒 수치 흐름 진입
  }

  // 서버가 흐름 해제 시
  if (data.sessionFlow === "free") {
    sessionFlow = "free";
  }
}
