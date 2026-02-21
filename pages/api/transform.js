console.log("TRANSFORM V2 ACTIVE");
export const config = {
  api: { bodyParser: false },
};

import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Transform this photo into a realistic 1990s Kodak film style with warm tones, subtle grain and soft vignette. Keep identity exactly the same.";
    case "balloon":
      return "Make the person's head look like a funny inflated balloon while keeping identity recognizable.";
    default:
      return "Enhance this image professionally with natural colors and sharp detail.";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("FORM ERROR:", err);
      return res.status(400).json({ error: "Upload error" });
    }

    let imageFile = files.image;
    if (Array.isArray(imageFile)) imageFile = imageFile[0];

    const effect = Array.isArray(fields.effect)
      ? fields.effect[0]
      : fields.effect || "default";

    if (!imageFile) {
      return res.status(400).json({ error: "No image provided" });
    }

    try {
      // Dosyayı oku
      const fileBuffer = fs.readFileSync(imageFile.filepath);
      const base64Image = fileBuffer.toString("base64");

      // 🔥 DOĞRU ENDPOINT BURASI
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: getPrompt(effect),
        image: `data:${imageFile.mimetype};base64,${base64Image}`,
        size: "1024x1024",
      });

      const generatedImage = response.data?.[0]?.b64_json;

      if (!generatedImage) {
        console.error("RAW RESPONSE:", response);
        return res.status(500).json({ error: "No image returned" });
      }

      return res.status(200).json({
        success: true,
        image: generatedImage,
      });

    } catch (error) {
      console.error("OPENAI ERROR:", error);
      return res.status(500).json({
        error: error.message || "Image generation failed",
      });
    }
  });
}