export const runtime = "nodejs";

import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: { bodyParser: false },
};

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Transform this photo into a realistic 1990s Kodak film style with warm tones, subtle grain, and soft vignette. Keep the same person and identity.";
    case "balloon":
      return "Make the person's head look like a funny inflated balloon while keeping their identity recognizable.";
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
    if (err) {
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
      const base64 = fs.readFileSync(imageFile.filepath).toString("base64");

      const dataUrl = `data:image/png;base64,${base64}`;

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: getPrompt(effect),
                },
                {
                  type: "input_image",
                  image_url: dataUrl,
                },
              ],
            },