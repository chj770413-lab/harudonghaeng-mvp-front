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

  // 서버가 숫자 확인 단계로 들어가라고 했을 때
  if (who === "bot" && text.includes("제가 이렇게 들었어요")) {
    pendingNumericConfirm = true;
  }
}

function classifyConfirmAction(text) {
  if (/^(맞아|네|예)$/i.test(text)) return "yes";
  if (/^(아니야|아니|틀려|다시)$/i.test(text)) return "no";
  if (/^(응|응 맞아|맞는 것 같아)$/i.test(text)) return "loose";
  return null;
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  const confirmAction = pendingNumericConfirm
    ? classifyConfirmAction(text)
    : null;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,

        // 🔑 핵심: 서버로 정확한 상태 전달
        pendingNumericConfirm,
        heardNumber,
        confirmAction,
      }),
    });

    const data = await res.json();

    // 서버가 다시 확인 단계라고 알려주면 상태 갱신
    if (data.needConfirm === true) {
      pendingNumericConfirm = true;
      heardNumber = data.heardNumber ?? null;
    } else {
      pendingNumericConfirm = false;
      heardNumber = null;
    }

    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}
