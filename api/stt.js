import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

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
    // 1️⃣ 요청 바디를 buffer로 받기
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 2️⃣ 임시 파일로 저장 (Node에서 가장 안정적)
    const tempFilePath = path.join(tmpdir(), `audio-${Date.now()}.wav`);
    fs.writeFileSync(tempFilePath, buffer);

    // 3️⃣ Whisper STT
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "gpt-4o-mini-transcribe",
      language: "ko",
    });

    // 4️⃣ 임시 파일 삭제
    fs.unlinkSync(tempFilePath);

    // 5️⃣ 결과 반환
    res.status(200).json({
      text: transcription.text || "",
    });
  } catch (error) {
    console.error("STT error:", error);
    res.status(500).json({ error: "STT failed" });
  }
}
