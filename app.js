const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// 🔒 숫자 확인 단계 플래그 (단 하나만 사용)
let pendingNumericConfirm = false;

// ----------------------------
// 화면 전환
// ----------------------------
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
  pendingNumericConfirm = false;
}

// ----------------------------
// 메시지 표시
// ----------------------------
function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // 🔑 서버가 숫자 확인 문구를 보냈을 때만 true
  if (who === "bot" && text.startsWith("제가 이렇게 들었어요")) {
    pendingNumericConfirm = true;
  }
}

// ----------------------------
// 메시지 전송
// ----------------------------
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ==========================================
  // 🔴 핵심: 숫자 확인 단계에서는
  // 사용자의 "맞아/아니야/응 맞아"를
  // ❌ 절대 AI로 보내지 않는다
  // ==========================================
  if (pendingNumericConfirm) {
    const normalized = text.replace(/\s+/g, "");

    if (
      normalized === "맞아" ||
      normalized === "아니야" ||
      normalized === "응맞아" ||
      normalized === "응"
    ) {
      // 🔒 확인 단계 종료
      pendingNumericConfirm = false;

      // ✅ AI에게는 반드시 '명확한 설명 요청'만 보낸다
      return requestExplanation();
    }

    // 다른 말이면 다시 안내
    addMessage(
      "bot",
      "확인을 위해서요.\n맞으면 '맞아', 아니면 '아니야'라고 말씀해 주세요."
    );
    return;
  }

  // ==========================================
  // 🔵 일반 메시지 흐름
  // ==========================================
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,
        pendingNumericConfirm: false,
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}

// ----------------------------
// 🔧 설명 요청 전용 함수 (중요)
// ----------------------------
async function requestExplanation() {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ❗ 절대 모호한 문장 금지
        message:
          "확인된 건강 수치에 대해, 한 번의 수치로 단정하지 말고 2~3문장으로 설명해 주세요. 마지막에 질문 1개만 해 주세요.",
        mode: currentMode,
        pendingNumericConfirm: false,
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}

