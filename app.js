const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// ✅ 서버 확인 단계 상태
let pendingNumericConfirm = false;

// ✅ 서버가 내려준 "제가 이렇게 들었어요: N"의 N을 저장
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
}

function isConfirmText(t) {
  const s = String(t).trim();
  return (
    s === "맞아" || s === "네" || s === "예" ||
    s === "아니야" || s === "아니" ||
    s === "응 맞아" || s === "응"
  );
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ✅ 확인 단계에서 "응 맞아/맞아/아니야" 같은 말은
  //    서버가 '확인 처리'로만 쓰도록 상태/숫자를 같이 보냄
  const payload = {
    message: text,
    mode: currentMode,

    // ⭐ 핵심: 확인 단계 플래그 + 숫자
    pendingNumericConfirm,
    heardNumber,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // ✅ 서버가 숫자 확인 단계라고 알려주면 저장
    // data.needConfirm === true 이면 앞으로 "맞아/아니야"를 받는 상태
    if (data.needConfirm === true) {
      pendingNumericConfirm = true;
      heardNumber = Number.isFinite(data.heardNumber) ? data.heardNumber : null;
    }

    // ✅ 서버가 확인 단계를 끝냈다고 판단되는 순간:
    // - 설명 답변이 오면 needConfirm이 없으므로 pending 해제
    if (pendingNumericConfirm && data.needConfirm !== true && isConfirmText(text)) {
      // 사용자가 확인 입력을 했고, 서버가 확인 단계 종료 응답을 준 것
      pendingNumericConfirm = false;
      heardNumber = null;
    }

    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    addMessage("bot", "서버 연결 오류가 발생했습니다.");
  }
}

 
