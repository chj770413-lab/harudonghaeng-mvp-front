const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

// ✅ 대화 히스토리(서버로 항상 보냄)
let chatHistory = []; // { role: "user"|"assistant", content: string }

// ✅ 숫자 확인 단계 상태
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

  // ✅ 상태 초기화
  chatHistory = [];
  pendingNumericConfirm = false;
  heardNumber = null;
}

// 화면에 메시지 출력 + 히스토리 적재
function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  // ✅ 히스토리 적재 (중요)
  if (who === "bot") {
    chatHistory.push({ role: "assistant", content: text });
  } else {
    chatHistory.push({ role: "user", content: text });
  }
}

// ✅ 서버 호출(타임아웃 포함)
async function callServer(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 타임아웃

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    return data;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  // ✅ 확인 단계에서 "맞아/아니야/응 맞아/응"은 LLM으로 보내지 않고,
  //    서버에 'confirmAction'으로만 전달해서 확정 처리
  let confirmAction = null;

  if (pendingNumericConfirm) {
    const t = text.replace(/\s+/g, ""); // 공백 제거
    if (t === "맞아" || t === "네" || t === "예") confirmAction = "yes";
    if (t === "아니야" || t === "아니" || t === "틀려" || t === "다시") confirmAction = "no";
    if (t === "응맞아" || t === "응") confirmAction = "loose"; // 느슨한 동의
  }

  try {
    // ✅ 서버로 보낼 payload 확정
    const payload = {
      mode: currentMode,
      message: text,
      messages: chatHistory,                 // ⭐️ 핵심: 대화 히스토리 전송
      pendingNumericConfirm: pendingNumericConfirm,
      heardNumber: heardNumber,              // ⭐️ 핵심: 서버가 준 heardNumber를 다시 보냄
      confirmAction: confirmAction,          // ⭐️ 핵심: 확인 입력을 버튼처럼 처리
    };

    console.log("[REQ]", payload);

    const data = await callServer(payload);

    console.log("[RES]", data);

    // ✅ 서버가 needConfirm을 내려주면 프론트 상태 업데이트
    if (data.needConfirm === true) {
      pendingNumericConfirm = true;
      heardNumber = Number.isFinite(data.heardNumber) ? data.heardNumber : null;
    } else if (data.needConfirm === false) {
      pendingNumericConfirm = false;
      heardNumber = null;
    }

    addMessage("bot", data.reply || "응답이 없습니다.");
  } catch (err) {
    if (err.name === "AbortError") {
      addMessage("bot", "응답이 조금 늦어지고 있어요. 잠시 후 다시 한번 눌러주세요.");
    } else {
      addMessage("bot", "서버 연결 오류가 발생했습니다.");
    }
  }
}
