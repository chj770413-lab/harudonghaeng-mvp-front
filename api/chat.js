// /api/chat.js

function classifyMood(text) {
  const t = text.toLowerCase();

  if (
    t.includes("불안") ||
    t.includes("걱정") ||
    t.includes("무서") ||
    t.includes("마음")
  ) {
    return "anxious";
  }

  if (
    t.includes("피곤") ||
    t.includes("힘들") ||
    t.includes("기운") ||
    t.includes("지쳐")
  ) {
    return "tired";
  }

  if (
    t.includes("괜찮") ||
    t.includes("좋아") ||
    t.includes("별일") ||
    t.includes("문제없")
  ) {
    return "okay";
  }

  return "unknown";
}

function nurseReply(type) {
  if (type === "okay") {
    return "다행이에요. 지금처럼만 지내셔도 괜찮아 보여요.";
  }

  if (type === "tired") {
    return "오늘 많이 쓰셨나 봐요. 지금은 잠깐 쉬어도 괜찮아 보여요.";
  }

  if (type === "anxious") {
    return "아직 마음이 편하지 않으시군요. 제가 여기 있으니, 조금만 더 같이 이야기해볼까요.";
  }

  return null; // AI로 넘길 신호
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method Not Allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "메시지가 없습니다." });
    }

    // ✅ 1단계: 말투 분기 먼저
    const mood = classifyMood(message);
    const fixedReply = nurseReply(mood);

    if (fixedReply) {
      return res.status(200).json({ reply: fixedReply });
    }

    // ✅ 2단계: 분기로 처리 못 한 경우만 AI 호출
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
너는 시니어와 대화하는 간호사다.
말투는 짧고, 부드럽고, 판단하지 않는다.
의학적 진단이나 지시는 하지 않는다.
항상 현재 상황만 말하고, 한 문장씩 이야기한다.
질문은 한 번에 하나만 한다.
모든 답변은 안심되는 문장으로 끝낸다.
              `,
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ??
      "지금은 이대로 괜찮아 보여요. 필요하시면 언제든지 다시 불러주세요.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    return res.status(500).json({
      reply: "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
    });
  }
}
