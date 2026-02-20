console.log("NEW CODE RUNNING");
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Recreate this photo in realistic 1990s Kodak film style. Warm tones, grain, subtle light leaks, cinematic feel.";
    case "balloon":
      return "Make the person's head look like a funny inflated balloon while keeping identity recognizable.";
    default:
      return "Enhance this image professionally.";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const imageFile = files.image?.[0];
    const effect = fields.effect?.[0] || "default";

    if (!imageFile)
      return res.status(400).json({ error: "No image provided" });

    try {
      // 🔥 Dosyayı base64'e çevir
      const imageBuffer = fs.readFileSync(imageFile.filepath);
      const base64Image = imageBuffer.toString("base64");

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: getPrompt(effect),
        image: base64Image,
        size: "1024x1024",
      });

      return res.status(200).json({
        image: response.data[0].b64_json,
      });

  catch (e) {
  console.error("FULL ERROR:", e);
  return res.status(500).json({
    error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
      });
    }
  });
}