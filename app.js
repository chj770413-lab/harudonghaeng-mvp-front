const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";
let currentRecognition = null; // 🎤 현재 음성 인식 상태 저장


// ✅ 숫자 확인 상태
let pendingNumericConfirm = false;
let heardNumber = null;

// ✅ 세션 흐름 상태 (핵심)
let sessionFlow = "free"; // "free" | "numeric"

// ✅ 대화 히스토리
let chatHistory = [];

// =====================
// 화면 전환
// =====================
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
  // 🔹 음성 인식 중이면 종료
  if (currentRecognition) {
    try { currentRecognition.stop(); } catch (e) {}
    currentRecognition = null;
  }

  // 🔹 모든 화면 숨기고 홈만 표시
  const chat = document.getElementById("chat");
  const daily = document.getElementById("daily");
  const home = document.getElementById("home");

  if (chat) chat.style.display = "none";
  if (daily) daily.style.display = "none";
  if (home) home.style.display = "block";

  // 🔹 기존 채팅 초기화
  const chatLog = document.getElementById("chatLog");
  if (chatLog) chatLog.innerHTML = "";

  // 🔹 하루안심정리 초기화
  const dailyText = document.getElementById("dailyText");
  const dailyResult = document.getElementById("dailyResult");
  if (dailyText) dailyText.innerText = "";
  if (dailyResult) dailyResult.innerText = "";

  // 🔹 기존 상태값 초기화 (그대로 유지)
  pendingNumericConfirm = false;
  heardNumber = null;
  sessionFlow = "free";
  chatHistory = [];
}


// =====================
// 메시지 출력 + 히스토리
// =====================
function addMessage(who, text) {
  const chatLog = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = who === "bot" ? "bot-msg" : "user-msg";
  div.innerText = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;

  chatHistory.push({
    role: who === "bot" ? "assistant" : "user",
    content: text,
  });
}

// =====================
// confirmAction 결정
// =====================
function resolveConfirmAction(text) {
  const t = text.trim();

  if (/^(맞아|응 맞아|응|네)$/.test(t)) return "yes";
  if (/^(아니야|아니)$/.test(t)) return "no";

  return null;
}

// =====================
// 메시지 전송 (❗️에러 UX 완전 차단 버전)
// =====================
async function sendMessage() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";

  try {
    // =====================
    // 🔴 숫자 확인 단계
    // =====================
    if (pendingNumericConfirm) {
      const action = resolveConfirmAction(text);

      if (!action) {
        addMessage("bot", "맞으면 '맞아', 아니면 '아니야'라고 해주세요.");
        return;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "numericConfirm",
          pendingNumericConfirm: true,
          heardNumber,
          confirmAction: action,
          mode: currentMode,
          sessionFlow,
        }),
      });

      // ❗ 서버 500/404 등 모든 실패를 여기서 잡음
      if (!res.ok) throw new Error("server error");

      const data = await res.json();
      addMessage("bot", data.reply);

      // 상태 갱신
      pendingNumericConfirm = data.needConfirm === true;

      if (data.needConfirm && data.heardNumber) {
        heardNumber = data.heardNumber;
        sessionFlow = "numeric";
      } else {
        // 설명 완료
        pendingNumericConfirm = false;
        heardNumber = null;
        sessionFlow = "free";
      }

      return;
    }

    // =====================
    // 🔵 일반 메시지
    // =====================
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        mode: currentMode,
        sessionFlow,
      }),
    });

    if (!res.ok) throw new Error("server error");

    const data = await res.json();
    addMessage("bot", data.reply);

    // 숫자 확인 진입
    if (data.needConfirm && data.heardNumber) {
      pendingNumericConfirm = true;
      heardNumber = data.heardNumber;
      sessionFlow = "numeric";
    }
  } catch (e) {
    // =====================
    // ❌ 시스템/지연/오류 문구 완전 차단
    // =====================
    addMessage(
      "bot",
      "말씀해 주신 내용을 기준으로 계속 도와드릴게요. 조금만 더 알려주실 수 있을까요?"
    );
  }
}


function goDaily() {
  document.getElementById("home").style.display = "none";
  document.getElementById("chat").style.display = "none";
  document.getElementById("daily").style.display = "block";

  document.getElementById("voiceText").innerText = "";
  document.getElementById("dailyResult").innerHTML = "";
}

let recognition;

function startVoice() {
  const output = document.getElementById("dailyText");
  const result = document.getElementById("dailyResult");

  if (output) output.innerText = "";
  if (result) result.innerText = "";

  // 🔹 이전 음성 인식 종료
  if (currentRecognition) {
    try { currentRecognition.stop(); } catch (e) {}
    currentRecognition = null;
  }

  // 🔹 브라우저 지원 체크
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (output) {
      output.innerText = "이 브라우저에서는 음성 인식이 지원되지 않습니다.";
    }
    return;
  }

  const recognition = new SpeechRecognition();
  currentRecognition = recognition;

  recognition.lang = "ko-KR";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join(" ");
    if (output) output.innerText = transcript;
  };

  recognition.onerror = () => {
    if (output) {
      output.innerText = "잘 들리지 않았어요. 다시 한 번 말씀해 주세요.";
    }
  };

  recognition.onend = () => {
  const output = document.getElementById("dailyText");
  if (output && output.innerText.trim()) {
    sendDailySummary(output.innerText.trim());
  }
};

  recognition.start();
}

function stopVoice() {
  // 🔹 마이크 끄기
  if (currentRecognition) {
    try { currentRecognition.stop(); } catch (e) {}
    currentRecognition = null;
  }

  const output = document.getElementById("dailyText");
  const result = document.getElementById("dailyResult");

  // ✅ 요약 중이라는 표시 (체감 속도 개선)
  if (result) {
    result.innerText = "오늘 이야기를 정리하고 있어요…";
  }

  // 🔹 실제 요약 실행
  if (output && output.innerText.trim()) {
    sendDailySummary(output.innerText.trim());
  }
}


  recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

 const output = document.getElementById("dailyText");
if (output) {
  output.innerText = "말씀해 주세요…";
}
recognition.start();


  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    output.innerText = `“${transcript}”`;

    sendDailySummary(transcript);

  };

  recognition.onerror = function () {
  const output = document.getElementById("dailyText");
  if (output) {
    output.innerText = "잘 들리지 않았어요. 다시 한 번 말씀해 주세요.";
  }
};


async function sendDailySummary(text) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `
다음은 한 사람의 하루 상태 기록입니다.
대화하지 말고, 질문하지 말고, 조언하지 마세요.
상대에게 말을 거는 표현(예: ~하셨군요, ~바랍니다)을 사용하지 마세요.
원인, 이유, 해석, 위로, 덕담, 일반화 표현을 모두 사용하지 마세요.
사실을 서술하는 문장 형태로만 2문장을 작성하세요.
일기나 기록처럼 담담하게 씁니다.

[하루 상태 기록]
${text}
`
      })
    });

    const data = await res.json();
    console.log("📦 AI 응답 전체:", data);

    let reply =
      data.reply ||
      data.message ||
      data.result ||
      data.choices?.[0]?.message?.content ||
      "";

    // 🔥 AI가 혹시 만들어낸 마무리/덕담 문장 제거 (안전장치)
    reply = reply
      .replace(/오늘은.*정도.*(충분|마무리).*습니다\.?/g, "")
      .replace(/.*바랍니다\.?/g, "")
      .trim();

    document.getElementById("dailyResult").innerText =
      reply + "\n" + getClosingLine();

  } catch (e) {
    console.error("AI 요약 오류", e);
    document.getElementById("dailyResult").innerText =
      getClosingLine();
  }
}

const closingLines = [
  "오늘은 여기까지 정리하면 충분합니다.",
  "오늘 하루는 이 정도로 정리해 두겠습니다.",
  "오늘 기록은 여기까지로 남겨두겠습니다.",
  "오늘 상태는 이 정도로 정리됩니다.",
  "오늘 하루는 이 정도로 마무리됩니다.",
  "오늘은 이만 정리해 두어도 괜찮겠습니다.",
  "오늘 기록은 이 정도로 충분해 보입니다."
];

function getClosingLine() {
  return closingLines[Math.floor(Math.random() * closingLines.length)];
}
