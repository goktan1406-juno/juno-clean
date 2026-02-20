import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  async function upload() {
    const fileInput = document.getElementById("imageInput");
    const effectSelect = document.getElementById("effect");

    const file = fileInput.files[0];
    const effect = effectSelect.value;

    if (!file) {
      alert("Please select an image.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("effect", effect);

    try {
      setLoading(true);

      const response = await fetch("/api/transform", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Error: " + (data.error || "Unknown error"));
        return;
      }

      document.getElementById("result").src =
        "data:image/png;base64," + data.image;

    } catch (err) {
      alert("Upload failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Juno AI Effects</h1>

      <input type="file" id="imageInput" />

      <br /><br />

      <select id="effect">
        <option value="vintage">Vintage</option>
        <option value="balloon">Balloon Face</option>
      </select>

      <br /><br />

      <button onClick={upload} disabled={loading}>
        {loading ? "Processing..." : "Transform"}
      </button>

      <br /><br />

      <img
        id="result"
        alt="Result"
        style={{ maxWidth: "400px", marginTop: 20 }}
      />
    </div>
  );
}