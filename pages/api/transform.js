import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";

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

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const imageFile = files.image?.[0];
    const effect = fields.effect?.[0] || "default";

    if (!imageFile) {
      return res.status(400).json({ error: "No image provided" });
    }

    try {
      const formData = new FormData();

      formData.append("model", "dall-e-2");
      formData.append("prompt", getPrompt(effect));
      formData.append("image", fs.createReadStream(imageFile.filepath));
      formData.append("size", "512x512");

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