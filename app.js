const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// 숫자 확인 단계 여부
let isNumericConfirmMode = false;

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
  isNumericConfirmMode = false;
}

function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // 🔒 AI가 숫자 확인 문구를 냈을 때만 확인 모드 진입
  if (who === "bot" && text.includes("제가 이렇게 들었어요")) {
    isNumericConfirmMode = true;
  }
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const userText = input.value.trim();
  if (!userText) return;

  addMessage("user", userText);
  input.value = "";

  // 🔴 핵심 차단 로직
  // 숫자 확인 단계에서는 어떤 확인 발화도 서버로 보내지 않음
  if (isNumericConfirmMode) {
    // 사용자가 확인 의도로 말한 경우
    if (
      userText.includes("맞아") ||
      userText.includes("응") ||
      userText.includes("그래")
    ) {
      isNumericConfirmMode = false;

      // ❗ 서버에는 항상 동일한 문장만 보냄
      await sendToServer("확인된 수치에 대해 설명해 주세요.");
      return;
    }

    // 수정 의도
    if (userText.includes("아니")) {
      isNumericConfirmMode = false;
      addMessage(
        "bot",
        "괜찮아요. 숫자를 한 자리씩 천천히 다시 말씀해 주세요."
      );
      return;
    }
  }

  // 🟢 일반 메시지
  await sendToServer(userText);
}

async function sendToServer(text) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,
      }),
    });

    const data = await res.json();
    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}
