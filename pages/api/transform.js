import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return `
      Transform this photo into a realistic 1990s Kodak film style.
      Add warm tones, subtle grain, light leaks.
      Keep face natural and identity consistent.
      `;

    case "balloon":
      return `
      Make the person's head look like an inflated balloon.
      Funny and exaggerated but recognizable.
      `;

    default:
      return `Enhance this image professionally.`;
  }
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {

    if (err) {
      return res.status(500).json({ error: "Upload error" });
    }

    const imageFile = files.image?.[0];
    const effect = fields.effect?.[0] || "default";

    if (!imageFile) {
      return res.status(400).json({ error: "No image provided" });
    }

    try {

      const response = await openai.images.edit({
        model: "gpt-image-1",
        image: fs.createReadStream(imageFile.filepath),
        prompt: getPrompt(effect),
        size: "512x512"
      });

      return res.status(200).json({
        image: response.data[0].b64_json
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
}