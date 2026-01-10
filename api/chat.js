export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method Not Allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "메시지가 없습니다." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ??
      "지금은 답변을 준비하지 못했어요. 다시 한 번 말씀해 주세요.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      reply: "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
    });
  }
}
