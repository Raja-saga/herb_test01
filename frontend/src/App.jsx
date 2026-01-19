import ImageUpload from "./components/ImageUpload";
import "./styles.css";

export default function App() {
  return (
    <>
      <div className="header">Herb Identification System</div>

      <div className="card">
        <h2>Upload Herb Image</h2>
        <ImageUpload />
      </div>
    </>
  );
}
