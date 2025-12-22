const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";
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

  // 🔑 숫자 확인 단계 진입 트리거
  if (who === "bot" && text.includes("제가 이렇게 들었어요")) {
    pendingNumericConfirm = true;
  }
}

// ----------------------------
// 메시지 전송 (핵심 로직)
// ----------------------------
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ============================
  // 🔴 핵심: 숫자 확인 단계 차단
  // ============================
  if (pendingNumericConfirm) {
    // 사용자가 어떤 형태로든 동의/부정 의사를 말하면
    if (
      text === "맞아" ||
      text === "응 맞아" ||
      text === "네" ||
      text === "예" ||
      text === "아니야" ||
      text === "아니"
    ) {
      // 1️⃣ 확인 단계 종료
      pendingNumericConfirm = false;

      // 2️⃣ 서버에는 절대 "맞아"를 보내지 않음
      //    → 우리가 만든 설명 요청만 보냄
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "확인된 수치에 대해 설명해 주세요.",
            mode: currentMode,
            pendingNumericConfirm: false,
          }),
        });

        const data = await res.json();
        addMessage("bot", data.reply || "응답이 없습니다.");
        return; // ❗ 반드시 종료
      } catch (err) {
        addMessage("bot", "서버 연결 오류가 발생했습니다.");
        return;
      }
    }
  }

  // ============================
  // 🔵 일반 메시지 전송
  // ============================
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,
        pendingNumericConfirm,
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}


