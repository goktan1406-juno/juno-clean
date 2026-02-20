export default function Home() {
  async function upload() {
    const file = document.getElementById("imageInput").files[0];
    const effect = document.getElementById("effect").value;

    if (!file) {
      alert("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("effect", effect);

    const response = await fetch("/api/transform", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.image) {
      document.getElementById("result").src =
        "data:image/png;base64," + data.image;
    } else {
      alert("Error: " + JSON.stringify(data));
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Juno AI Effects</h1>

      <input type="file" id="imageInput" />
      
      <select id="effect">
        <option value="vintage">Vintage</option>
        <option value="balloon">Balloon Face</option>
      </select>

      <button onClick={upload}>Transform</button>

      <br /><br />
      <img id="result" width="300" />
    </div>
  );
}