import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [effect, setEffect] = useState("vintage");

  async function resizeImage(file) {
    const img = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const maxSize = 512;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png", 0.5);
    });
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const resized = await resizeImage(file);
    setImage(resized);
  }

  async function handleSubmit() {
    if (!image) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("effect", effect);

    const res = await fetch("/api/transform", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.image) {
      setResult(`data:image/png;base64,${data.image}`);
    } else {
      alert(data.error || "Error");
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>JUNO AI</h1>

      <input type="file" accept="image/*" onChange={handleUpload} />

      <br /><br />

      <select value={effect} onChange={(e) => setEffect(e.target.value)}>
        <option value="vintage">Vintage</option>
        <option value="balloon">Balloon Head</option>
      </select>

      <br /><br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Transform"}
      </button>

      <br /><br />

      {result && (
        <div>
          <h3>Result:</h3>
          <img src={result} style={{ maxWidth: 400 }} />
        </div>
      )}
    </div>
  );
}