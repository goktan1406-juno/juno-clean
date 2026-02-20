import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: false },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Recreate this image in realistic 1990s Kodak film style.";
    case "balloon":
      return "Make the person's head look like a funny inflated balloon while keeping identity recognizable.";
    default:
      return "Enhance this image professionally.";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const imageFile = files.image?.[0];
    const effect = fields.effect?.[0] || "default";

    if (!imageFile) {
      return res.status(400).json({ error: "No image provided" });
    }

    try {
      const response = await openai.images.edit({
        model: "dall-e-2",
        image: fs.createReadStream(imageFile.filepath),
        prompt: getPrompt(effect),
        size: "512x512",
        response_format: "b64_json",
      });

      return res.status(200).json({
        image: response.data[0].b64_json,
      });

    } catch (e) {
      console.error("OPENAI ERROR:", e);
      return res.status(500).json({
        error: e.message,
      });
    }
  });
}