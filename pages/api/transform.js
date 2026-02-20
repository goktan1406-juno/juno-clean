export const runtime = "nodejs";

import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

export const config = {
  api: { bodyParser: false },
};

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

  const form = formidable({
    multiples: false,
    maxFileSize: 2 * 1024 * 1024, // 2MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "File too large (max 2MB)." });
    }

    // 🔥 formidable v2 / v3 uyumlu çözüm
    let imageFile = files.image;
    if (Array.isArray(imageFile)) {
      imageFile = imageFile[0];
    }

    const effect = Array.isArray(fields.effect)
      ? fields.effect[0]
      : fields.effect || "default";

    if (!imageFile) {
      return res.status(400).json({ error: "No image provided" });
    }

    try {
      const formData = new FormData();

      formData.append("model", "dall-e-2");
      formData.append("prompt", getPrompt(effect));
      formData.append("size", "512x512");
      formData.append("response_format", "b64_json");

      // 🔥 BURASI KRİTİK
      formData.append(
        "image",
        fs.createReadStream(imageFile.filepath),
        {
          filename: "image.png",
          contentType: "image/png",
        }
      );

      const response = await fetch(
        "https://api.openai.com/v1/images/edits",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!data.data || !data.data[0]) {
        console.error("OPENAI RAW RESPONSE:", data);
        return res.status(500).json({
          error: "No image returned from OpenAI",
          raw: data,
        });
      }

      return res.status(200).json({
        image: data.data[0].b64_json,
      });

    } catch (e) {
      console.error("OPENAI ERROR:", e);
      return res.status(500).json({
        error: e.message,
      });
    }
  });
}