import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Recreate this image in realistic 1990s Kodak film style. Warm tones, subtle grain.";
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
      const imageBuffer = fs.readFileSync(imageFile.filepath);
      const base64Image = imageBuffer.toString("base64");

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: getPrompt(effect),
            image: base64Image,
            size: "512x512"
          }),
        }
      );

      const text = await response.text();

      // HTML gelirse debug için göster
      if (!text.startsWith("{")) {
        console.error("RAW RESPONSE:", text);
        return res.status(500).json({
          error: "Invalid response from OpenAI",
        });
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        console.error("OPENAI ERROR:", data);
        return res.status(500).json({
          error: data?.error?.message || "Image generation failed",
        });
      }

      return res.status(200).json({
        image: data.data[0].b64_json,
      });

    } catch (e) {
      console.error("SERVER ERROR:", e);
      return res.status(500).json({
        error: e?.message || "Server error",
      });
    }
  });
}