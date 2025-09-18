import { useState } from "react";
import Cropper from "react-easy-crop";
import "./App.css";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

function App() {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const [format, setFormat] = useState("png");
  const [size, setSize] = useState("original");

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage(reader.result);
        setCroppedImage(null);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxSize = Math.max(
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.width = maxSize;
      canvas.height = maxSize;

      ctx.beginPath();
      ctx.arc(maxSize / 2, maxSize / 2, maxSize / 2, 0, 2 * Math.PI);
      ctx.clip();

      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        maxSize,
        maxSize
      );

      const croppedImageUrl = canvas.toDataURL("image/png");
      setCroppedImage(croppedImageUrl);
      return croppedImageUrl;
    } catch (e) {
      console.error("Error creating cropped image:", e);
    }
  };

  const resizeImage = (imgSrc, targetSize, cb) => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (targetSize !== "original") {
        if (targetSize === "256") {
          width = 256;
          height = 256;
        } else if (targetSize === "1080") {
          width = 1080;
          height = 1080;
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      cb(canvas.toDataURL("image/png"));
    };
  };

  const downloadImage = () => {
    if (!croppedImage) return;

    resizeImage(croppedImage, size, (resizedDataUrl) => {
      if (format === "png") {
        fetch(resizedDataUrl)
          .then((res) => res.blob())
          .then((blob) => saveAs(blob, "cropped-image.png"));
      }

      if (format === "jpg") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = resizedDataUrl;
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            saveAs(blob, "cropped-image.jpg");
          }, "image/jpeg", 1);
        };
      }

      if (format === "pdf") {
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(resizedDataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(resizedDataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("cropped-image.pdf");
      }
    });
  };

  const resetImage = () => {
    setImage(null);
    setCroppedImage(null);
  };

  return (
    <div className="app-container">
      <h1>Circle Crop Image</h1>
      <p className="app-description">
        {croppedImage
          ? "Upload an image, crop it into a perfect circle, and download the result."
          : "Crop images instantly in perfect circles for social media, display picture, headshot and more with multiple file formats, multiple file sizes and original size."}
      </p>

      {!image && (
        <div className="upload-box">
          <label className="upload-label">
            <input type="file" accept="image/*" onChange={onFileChange} />
            <div className="image">
            <span>Upload Your Image</span>
            <span>Drag & drop or click to select your image (Max 10 MB) </span>
            </div>
          </label>
        </div>
      )}

      {image && !croppedImage && (
        <div className="cropper-container">
          <div className="cropper">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              cropShape="round"
              showGrid={false}
            />
          </div>
          <div className="controls">
            <div className="zoom-control">
              <label>Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="zoom-control">
              <label>Rotate Image</label>
              <input
                type="range"
                value={rotation}
                min={-180}
                max={180}
                step={1}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
              <span>{rotation}°</span>
            </div>
            <div className="buttons">
              <button className="button" onClick={resetImage}>
                Cancel
              </button>
              <button className="button primary" onClick={getCroppedImg}>
                Crop Image
              </button>
            </div>
          </div>
        </div>
      )}

      {croppedImage && (
        <div className="result-container">
          <div className="preview">
            <img src={croppedImage} alt="Cropped" className="cropped-image" />
          </div>

          <div className="options">
            <p>Download</p>
            <label>
              <input
                type="radio"
                value="jpg"
                checked={format === "jpg"}
                onChange={(e) => setFormat(e.target.value)}
              />
              .jpg
            </label>
            <label>
              <input
                type="radio"
                value="png"
                checked={format === "png"}
                onChange={(e) => setFormat(e.target.value)}
              />
              .png
            </label>
            <label>
              <input
                type="radio"
                value="pdf"
                checked={format === "pdf"}
                onChange={(e) => setFormat(e.target.value)}
              />
              .pdf
            </label>

            <p>Size</p>
            <label>
              <input
                type="radio"
                value="256"
                checked={size === "256"}
                onChange={(e) => setSize(e.target.value)}
              />
              256×256 px
            </label>
            <label>
              <input
                type="radio"
                value="1080"
                checked={size === "1080"}
                onChange={(e) => setSize(e.target.value)}
              />
              1080×1080 px
            </label>
            <label>
              <input
                type="radio"
                value="original"
                checked={size === "original"}
                onChange={(e) => setSize(e.target.value)}
              />
              Original
            </label>
          </div>

          <div className="buttons">
            <button className="button" onClick={resetImage}>
              Start Over
            </button>
            <button className="button primary" onClick={downloadImage}>
              Crop and Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
