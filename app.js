const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";
let pendingNumericConfirm = false; // ✅ 추가

// 화면 전환
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
  pendingNumericConfirm = false; // ✅ 초기화
}

function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // ✅ AI가 숫자 확인 문구를 냈으면 확인 모드 ON
  if (who === "bot" && text.includes("제가 이렇게 들었어요")) {
    pendingNumericConfirm = true;
  }
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ✅ 사용자가 확인 응답을 하면 확인 모드 해제
  if (text === "맞아" || text === "아니야") {
    pendingNumericConfirm = false;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,
        pendingNumericConfirm: pendingNumericConfirm, // ✅ 핵심
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}
