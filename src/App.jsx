import { useState } from 'react'
import Cropper from 'react-easy-crop'
import './App.css'
import { saveAs } from 'file-saver'

function App() {
  const [image, setImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImage(reader.result)
        setCroppedImage(null)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Set canvas dimensions to the cropped area dimensions
      const maxSize = Math.max(croppedAreaPixels.width, croppedAreaPixels.height)
      canvas.width = maxSize
      canvas.height = maxSize

      // Draw a circle
      ctx.beginPath()
      ctx.arc(maxSize / 2, maxSize / 2, maxSize / 2, 0, 2 * Math.PI)
      ctx.clip()

      // Draw the image
      const scaleX = img.naturalWidth / img.width
      const scaleY = img.naturalHeight / img.height
      const pixelRatio = window.devicePixelRatio

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
      )

      // Convert canvas to blob
      const croppedImageUrl = canvas.toDataURL('image/png')
      setCroppedImage(croppedImageUrl)
      return croppedImageUrl
    } catch (e) {
      console.error('Error creating cropped image:', e)
    }
  }

  const downloadImage = () => {
    if (!croppedImage) return
    
    // Convert base64 to blob
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        saveAs(blob, 'cropped-image.png')
      })
  }

  const resetImage = () => {
    setImage(null)
    setCroppedImage(null)
  }

  return (
    <div className="app-container">
      <h1>Circle Crop Image</h1>
      <p className="app-description">
        Upload an image, crop it into a perfect circle, and download the result.
      </p>

      {!image && (
        <div className="upload-container">
          <label className="upload-button">
            <input type="file" accept="image/*" onChange={onFileChange} />
            Upload Image
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
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
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
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>
            <div className="buttons">
              <button className="button" onClick={resetImage}>Cancel</button>
              <button className="button primary" onClick={getCroppedImg}>Crop Image</button>
            </div>
          </div>
        </div>
      )}

      {croppedImage && (
        <div className="result-container">
          <div className="preview">
            <img src={croppedImage} alt="Cropped" className="cropped-image" />
          </div>
          <div className="buttons">
            <button className="button" onClick={resetImage}>Start Over</button>
            <button className="button primary" onClick={downloadImage}>Download</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
