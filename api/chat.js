import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: true,
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
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
    });

    // 최신 Responses API에서 가장 안전한 추출
    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "잠시만요, 다시 한 번 말씀해 주세요.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ error: error.message || "CHAT failed" });
  }
}
