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

  let startMessage =
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
// 메시지 출력
// ----------------------------
function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // 숫자 확인 단계 진입
  if (who === "bot" && text.includes("제가 이렇게 들었어요")) {
    pendingNumericConfirm = true;
  }
}

// ----------------------------
// 메시지 전송 (핵심)
// ----------------------------
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  // ============================
  // 🔴 핵심: 숫자 확인 단계
  // ============================
  if (pendingNumericConfirm) {
    // 1️⃣ 맞아 / 응 맞아 / 아니야 → 화면에도 안 남김, 서버에도 안 보냄
    if (
      text === "맞아" ||
      text === "응 맞아" ||
      text === "네" ||
      text === "예"
    ) {
      pendingNumericConfirm = false;

      // 설명 요청만 서버로 보냄
      await sendToServer("확인된 수치에 대해 설명해 주세요.");
      return;
    }

    if (text === "아니야" || text === "아니") {
      pendingNumericConfirm = false;
      addMessage("bot", "괜찮아요. 숫자를 다시 말씀해 주세요.");
      return;
    }

    // 그 외 말은 허용하지 않음
    addMessage(
      "bot",
      "확인을 위해서요. 맞으면 '맞아', 아니면 '아니야'라고 말씀해 주세요."
    );
    return;
  }

  // ============================
  // 🔵 일반 대화 흐름
  // ============================
  addMessage("user", text);
  await sendToServer(text);
}

// ----------------------------
// 서버 호출 공통
// ----------------------------
async function sendToServer(text) {
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
