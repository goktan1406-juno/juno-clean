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
      return "Transform this image into a realistic 1990s Kodak film photo. Warm tones, subtle grain, soft vignette. Keep identity exactly the same.";
    case "balloon":
      return "Make the person's head look like an inflated balloon. Funny and exaggerated but clearly recognizable.";
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
      const base64Image = fs
        .readFileSync(imageFile.filepath)
        .toString("base64");

      const dataUrl = `data:image/png;base64,${base64Image}`;

      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
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
                  { type: "input_text", text: getPrompt(effect) },
                  {
                    type: "input_image",
                    image_url: dataUrl
                  }
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      let image = null;

      if (result.output) {
        for (const item of result.output) {
          if (item.content) {
            for (const c of item.content) {
              if (c.type === "output_image") {
                image = c.image_base64;
                break;
              }
            }
          }
          if (image) break;
        }
      }

      if (!image) {
        console.error("RAW:", JSON.stringify(result, null, 2));
        return res.status(500).json({
          error: "No image returned",
          raw: result,
        });
      }

      return res.status(200).json({ image });

    } catch (e) {
      console.error("ERROR:", e);
      return res.status(500).json({ error: e.message });
    }
  });
}