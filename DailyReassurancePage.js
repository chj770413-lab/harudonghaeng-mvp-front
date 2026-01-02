function goDaily() {
  document.getElementById("home").style.display = "none";
  document.getElementById("chat").style.display = "none";
  document.getElementById("daily").style.display = "block";

  document.getElementById("voiceText").innerText = "";
  document.getElementById("dailyResult").innerHTML = "";
}

function backHome() {
  document.getElementById("daily").style.display = "none";
  document.getElementById("chat").style.display = "none";
  document.getElementById("home").style.display = "block";
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

    // 임시 안심 문장 (다음 단계에서 AI로 교체)
    document.getElementById("dailyResult").innerHTML = `
      <p>오늘은 전반적으로 무리 없는 하루로 보입니다.</p>
      <p>지금 당장 크게 걱정할 상황은 아니에요.</p>
      <p>오늘은 이 정도로 마무리하셔도 괜찮겠습니다.</p>
    `;
  };

  recognition.onerror = function () {
    output.innerText = "잘 들리지 않았어요. 다시 한 번 말씀해 주세요.";
  };
}
