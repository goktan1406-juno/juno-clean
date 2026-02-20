import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Transform this photo into a realistic 1990s Kodak film style. Warm tones, subtle grain, light leaks, soft vignette. Keep face natural and identity consistent.";
    case "balloon":
      return "Make the person's head look like an inflated balloon. Funny and exaggerated but recognizable. Keep facial features recognizable.";
    default:
      return "Enhance this image professionally. Keep it realistic.";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const form = formidable({
    multiples: false,
    keepExtensions: true, // ✅ uzantıyı koru (çok önemli)
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const imageFile = files.image?.[0];
    const effect = fields.effect?.[0] || "default";

    if (!imageFile) return res.status(400).json({ error: "No image provided" });

    // ✅ PNG zorunluluğu (dall-e-2 edit için)
    const original = imageFile.originalFilename || "";
    const ext = path.extname(original).toLowerCase();

    if (ext !== ".png") {
      return res.status(400).json({ error: "Please upload a PNG image (.png)." });
    }

    try {
      const response = await openai.images.edit({
        model: "dall-e-2",
        image: fs.createReadStream(imageFile.filepath),
        prompt: getPrompt(effect),
        size: "512x512",
        response_format: "b64_json",
      });

      return res.status(200).json({ image: response.data[0].b64_json });
    } catch (e) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  });
}