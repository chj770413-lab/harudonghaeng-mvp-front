import { useState } from "react";

function DailyReassurancePage() {
  const [summary, setSummary] = useState(null);

  const onSpeak = () => {
    setSummary([
      "오늘은 컨디션이 조금 떨어진 하루였어요.",
      "지금 당장 크게 걱정할 상황은 아니에요.",
      "오늘은 무리하지 않고 지내셔도 괜찮겠습니다."
    ]);
  };

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h2>
        오늘 몸이나 마음 상태를<br />
        편하게 말씀해 주세요
      </h2>

      <button
        onClick={onSpeak}
        style={{
          marginTop: 24,
          width: "100%",
          padding: "16px 0",
          fontSize: 18
        }}
      >
        🎤 말하기
      </button>

      {summary && (
        <div style={{ marginTop: 24, lineHeight: 1.6 }}>
          {summary.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: "#777" }}>
        이 정리는 참고용이며 의료적 판단을 대신하지 않습니다.
      </p>
    </div>
  );
}

export default DailyReassurancePage;
let recognition;

function startVoice() {
  const output = document.getElementById("voiceText");

  // 브라우저 지원 체크
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
  };

  recognition.onerror = function () {
    output.innerText = "잘 들리지 않았어요. 다시 한 번 말씀해 주세요.";
  };
}
