import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = {
  api: { bodyParser: false },
};

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

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const imageFile = files.image?.[0];
    const effect = fields.effect?.[0] || "default";
    if (!imageFile) return res.status(400).json({ error: "No image provided" });

    try {
      const fd = new FormData();

      // ✅ burada contentType'ı ZORLUYORUZ
      fd.append("image", fs.createReadStream(imageFile.filepath), {
        filename: "image.png",
        contentType: "image/png",
      });

      fd.append("prompt", getPrompt(effect));
      fd.append("size", "512x512");
      fd.append("response_format", "b64_json");
      fd.append("model", "dall-e-2");

      const r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...fd.getHeaders(),
        },
        body: fd,
      });

      const data = await r.json();

      if (!r.ok) {
        return res.status(r.status).json({ error: data?.error?.message || JSON.stringify(data) });
      }

      return res.status(200).json({ image: data.data[0].b64_json });
    } catch (e) {
      return res.status(500).json({ error: e?.message || String(e) });
    }
  });
}