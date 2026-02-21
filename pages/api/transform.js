export const config = {
  api: { bodyParser: false },
};

import formidable from "formidable";
import fs from "fs";

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
  console.log("TRANSFORM FINAL ACTIVE");

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
      const fileBuffer = fs.readFileSync(imageFile.filepath);
      const base64Image = fileBuffer.toString("base64");

      // 🔥 DIRECT REST CALL (SDK YOK)
      const response = await fetch("https://api.openai.com/v1/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: getPrompt(effect),
          image: `data:${imageFile.mimetype};base64,${base64Image}`,
          size: "1024x1024"
        }),
      });

      const data = await response.json();

      if (!data.data || !data.data[0]?.b64_json) {
        console.error("OPENAI RAW:", data);
        return res.status(500).json({ error: "No image returned" });
      }

      return res.status(200).json({
        success: true,
        image: data.data[0].b64_json,
      });

    } catch (error) {
      console.error("SERVER ERROR:", error);
      return res.status(500).json({
        error: error.message || "Image generation failed",
      });
    }
  });
}