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

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,

        // ✅ 핵심 1: 서버에 히스토리 보내기 (기억)
        messages: chatHistory,

        // ✅ 핵심 2: 숫자 확인 상태 + 들은 숫자 보내기
        pendingNumericConfirm,
        heardNumber,
      }),
    });

    const data = await res.json();

    // ✅ 서버가 "확인 단계"를 내려주면 프론트 상태 업데이트
    if (data.needConfirm === true) {
      pendingNumericConfirm = true;
      heardNumber = Number.isFinite(data.heardNumber) ? data.heardNumber : heardNumber;
    } else {
      pendingNumericConfirm = false;
      heardNumber = null;
    }

    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}
