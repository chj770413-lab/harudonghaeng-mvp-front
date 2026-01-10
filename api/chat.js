import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ body가 없을 경우 대비
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const text = body?.text;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "너는 ‘하루동행’의 간호사다. 진단이나 지시는 하지 않는다. 오늘 하루를 정리해 주는 한 문장으로만 답한다. 말투는 차분하고 따뜻하다.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 80,
      temperature: 0.4,
    });

    const reply = completion.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    console.error("CHAT error:", error);
    res.status(500).json({ error: "CHAT failed" });
  }
}
