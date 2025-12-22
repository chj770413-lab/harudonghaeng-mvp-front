const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// ✅ 숫자 확인 상태/숫자 저장
let pendingNumericConfirm = false;
let heardNumber = null;

// ✅ 대화 히스토리(서버로 보내서 "기억"하게 함)
let chatHistory = []; // [{role:"user"|"assistant", content:"..."}]

// 화면 전환
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
  chatHistory = [];
}

function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // ✅ 히스토리 쌓기
  chatHistory.push({
    role: who === "bot" ? "assistant" : "user",
    content: text,
  });
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ✅ 확인 단계일 때
  if (pendingNumericConfirm) {
    let action = null;

    if (text === "맞아" || text === "응 맞아" || text === "네") {
      action = "yes";
    } else if (text === "아니야" || text === "아니") {
      action = "no";
    }

    // 👉 확인 응답이면 "사용자 발화"는 AI로 안 보냄
    if (action) {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmAction: action,
          pendingNumericConfirm: true,
          heardNumber: lastHeardNumber, // 👈 반드시 유지
          mode: currentMode,
        }),
      });

      const data = await res.json();
      addMessage("bot", data.reply);
      pendingNumericConfirm = data.needConfirm === true;
      return;
    }
  }

  // 🔵 일반 메시지
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      pendingNumericConfirm,
      heardNumber: lastHeardNumber,
      mode: currentMode,
    }),
  });

  const data = await res.json();
  addMessage("bot", data.reply);

  if (data.needConfirm) {
    pendingNumericConfirm = true;
    lastHeardNumber = data.heardNumber;
  }
}
