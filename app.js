const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// 🔒 숫자 확인 상태
let pendingNumericConfirm = false;
let lastHeardNumber = null;

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

  pendingNumericConfirm = false;
  lastHeardNumber = null;
}

function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 🔥 핵심: 맞아/아니야는 AI로 보내지 않는다
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ----------------------------
  // 1️⃣ 숫자 확인 단계에서의 처리
  // ----------------------------
  if (pendingNumericConfirm) {
    // ✅ 맞아 / 응 맞아 → AI 호출 ❌
    if (/^(맞아|응\s*맞아|네|예)$/i.test(text)) {
      pendingNumericConfirm = false;

      // ✅ AI에게는 숫자만 다시 전달
      await callAI(`확인된 수치는 ${lastHeardNumber}입니다.`);
      return;
    }

    // ❌ 아니야 → 다시 숫자 말하게
    if (/^(아니야|아니|틀려|다시)$/i.test(text)) {
      pendingNumericConfirm = false;
      lastHeardNumber = null;
      addMessage(
        "bot",
        "괜찮아요. 숫자를 한 자리씩 천천히 말씀해 주세요.\n예를 들어 1, 4, 5 처럼요."
      );
      return;
    }
  }

  // ----------------------------
  // 2️⃣ 일반 입력 → AI로 전달
  // ----------------------------
  await callAI(text);
}

// 실제 AI 호출
async function callAI(message) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        mode: currentMode,
      }),
    });

    const data = await res.json();

    // ✅ 서버가 숫자 확인 요청을 보냈을 때
    if (data.needConfirm && data.heardNumber) {
      pendingNumericConfirm = true;
      lastHeardNumber = data.heardNumber;
    }

    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}


