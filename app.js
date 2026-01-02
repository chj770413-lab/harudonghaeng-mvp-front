const API_URL = "https://harudonghaeng-ai-proxy.vercel.app/api/chat";

let currentMode = "";

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
  document.getElementById("chat").style.display = "none";
  document.getElementById("home").style.display = "block";
  document.getElementById("chatLog").innerHTML = "";

  // ✅ 초기화
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
  const output = document.getElementById("voiceText");

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    output.innerText = "이 브라우저에서는 음성 인식이 지원되지 않습니다.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  output.innerText = "말씀해 주세요…";
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    output.innerText = `“${transcript}”`;

    sendDailySummary(transcript);

  };

  recognition.onerror = function () {
    output.innerText = "잘 들리지 않았어요. 다시 한 번 말씀해 주세요.";
  };
}
async function sendDailySummary(text) {
  try {
    const res = await fetch(
      'https://harudonghaeng-ai-proxy.vercel.app/api/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
  message: `
당신은 '하루동행'이라는 시니어 일상 동행 서비스의 AI입니다.
의학적 판단, 조언, 해결책, 행동 지시는 절대 하지 않습니다.
질문을 하거나 대화를 이어가지 않습니다.
일반적인 설명, 보편적 해석, 정상화, 위로 표현을 사용하지 않습니다.
원인 추측, 가능성 표현(예: 아마, ~일 수 있습니다)은 사용하지 않습니다.
보고서나 분석처럼 쓰지 말고, 사람에게 말하듯 담담하게 씁니다.
사용자의 하루 상태를 사실에 가까운 표현으로 3줄로 정리합니다.
마지막 문장은 반드시 "오늘은 이 정도면 충분합니다."로 끝냅니다.

[사용자 하루 기록]
${text}
`
})





      }
    );

   const data = await res.json();
console.log('📦 AI 응답 전체:', data);

const reply =
  data.reply ||
  data.message ||
  data.result ||
  data.choices?.[0]?.message?.content ||
  '';

document.getElementById('dailyResult').innerText =
  reply + "\n" + getClosingLine();

} catch (e) {
  console.error('AI 요약 오류', e);
  document.getElementById('dailyResult').innerText =
    getClosingLine();
}
}

