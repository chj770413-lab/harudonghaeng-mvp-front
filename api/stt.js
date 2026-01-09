import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], "audio.webm", { type: "audio/webm" }),
      model: "gpt-4o-mini-transcribe",
      language: "ko",
    });

    res.status(200).json({ text: transcription.text });
  } catch (error) {
    console.error("STT error:", error);
    res.status(500).json({ error: "STT failed" });
  }
}

