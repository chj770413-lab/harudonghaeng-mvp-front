const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";
let pendingNumericConfirm = false;
let heardNumber = null;

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
  heardNumber = null;
}

function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // 숫자 확인 단계 진입
  if (who === "bot" && text.includes("제가 이렇게 들었어요")) {
    const match = text.match(/\d{2,3}/);
    heardNumber = match ? Number(match[0]) : null;
    pendingNumericConfirm = true;
  }
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ✅ 숫자 확인 단계에서 "맞아 / 응 맞아" 처리
  if (pendingNumericConfirm && /^(맞아|응 맞아|네|예)$/i.test(text)) {
    pendingNumericConfirm = false;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ❗ 사용자 발화 대신, 우리가 만든 명확한 요청
          message: `혈당 수치 ${heardNumber}에 대해 단정하지 말고 2~3문장으로 설명해 주세요. 마지막에 질문 1개만 해 주세요.`,
        }),
      });

      const data = await res.json();
      addMessage("bot", data.reply || "응답이 없습니다.");
      return;
    } catch (err) {
      addMessage("bot", "서버 연결 오류가 발생했습니다.");
      return;
    }
  }

  // ❌ 숫자 확인 단계에서 "아니야"
  if (pendingNumericConfirm && /^(아니야|아니)$/i.test(text)) {
    addMessage(
      "bot",
      "괜찮아요. 숫자를 한 자리씩 천천히 다시 말씀해 주세요. 예를 들어 1, 4, 5 처럼요."
    );
    return;
  }

  // 🔵 일반 메시지
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}
