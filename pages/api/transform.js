import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

function getPrompt(effect) {
  switch (effect) {
    case "vintage":
      return "Recreate this photo in realistic 1990s Kodak film style. Warm tones, subtle grain.";
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
    if (err) {
      console.error("FORM ERROR:", err);
      return res.status(500).json({ error: "Upload error" });
    }

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
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: getPrompt(effect) },
                {
                  type: "input_image",
                  image_base64: base64Image,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      // 🔥 GERÇEK HATAYI GÖR
      if (!response.ok) {
        console.error("OPENAI FULL ERROR:", JSON.stringify(data, null, 2));
        return res.status(500).json({
          error: data?.error?.message || JSON.stringify(data),
        });
      }

      // 🔥 Güvenli image extraction
      const imageBase64 =
        data?.output?.[0]?.content?.find(c => c.type === "output_image")
          ?.image_base64;

      if (!imageBase64) {
        console.error("NO IMAGE IN RESPONSE:", JSON.stringify(data, null, 2));
        return res.status(500).json({
          error: "No image returned from OpenAI",
        });
      }

      return res.status(200).json({
        image: imageBase64,
      });

    } catch (e) {
      console.error("SERVER ERROR:", e);
      return res.status(500).json({
        error: e?.message || JSON.stringify(e),
      });
    }
  });
}