import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Recreate this image in realistic 1990s Kodak film style. Return only the edited image.";
    case "balloon":
      return "Make the person's head look like a funny inflated balloon while keeping identity recognizable. Return only the edited image.";
    default:
      return "Enhance this image professionally. Return only the edited image.";
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

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
                  image_url: `data:image/png;base64,${base64Image}`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OPENAI ERROR:", data);
        return res.status(500).json({
          error: data?.error?.message || "Image generation failed",
        });
      }

      const outputImage = data.output?.[0]?.content?.find(
        (c) => c.type === "output_image"
      );

      if (!outputImage) {
        console.error("NO IMAGE IN RESPONSE:", data);
        return res.status(500).json({
          error: "No image returned from OpenAI",
        });
      }

      return res.status(200).json({
        image: outputImage.image_base64,
      });

    } catch (e) {
      console.error("SERVER ERROR:", e);
      return res.status(500).json({
        error: e?.message || "Server error",
      });
    }
  });
}