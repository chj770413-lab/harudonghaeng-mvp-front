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

// 메시지 추가
function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 🔑 핵심: 사용자 입력 → confirmAction으로 변환
function resolveConfirmAction(text) {
  if (!pendingNumericConfirm) return null;

  if (text === "맞아" || text === "네" || text === "예") return "yes";
  if (text === "아니야" || text === "아니") return "no";
  if (text.includes("응")) return "loose";

  return null;
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  const confirmAction = resolveConfirmAction(text);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,

        // ✅ 상태는 프론트가 책임진다
        pendingNumericConfirm,
        heardNumber,
        confirmAction,
      }),
    });

    const data = await res.json();

    // ✅ 서버가 확인 단계라고 알려주면 상태 갱신
    if (data.needConfirm === true) {
      pendingNumericConfirm = true;
      heardNumber = Number.isFinite(data.heardNumber)
        ? data.heardNumber
        : null;
    } else {
      pendingNumericConfirm = false;
      heardNumber = null;
    }

    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}
