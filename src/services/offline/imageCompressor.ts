// ============================================================
// PASHURAKSHA (पशुरक्षा) — CLIENT-SIDE IMAGE COMPRESSOR
// Stage 6: Low-Bandwidth Optimization for Rural 2G/3G Connectivity
// ============================================================

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  maxDimension?: number
  quality?: number
}

export async function compressImage(
  fileOrDataUrl: File | string,
  optionsOrMaxDimension: number | ImageCompressionOptions = 1200,
  defaultQuality: number = 0.7
): Promise<string> {
  const maxDimension = typeof optionsOrMaxDimension === 'number'
    ? optionsOrMaxDimension
    : (optionsOrMaxDimension.maxDimension || optionsOrMaxDimension.maxWidth || 1200)
  const quality = typeof optionsOrMaxDimension === 'number'
    ? defaultQuality
    : (optionsOrMaxDimension.quality ?? defaultQuality)

  return new Promise((resolve, reject) => {
    const img = new Image()

    const processImage = () => {
      let width = img.width
      let height = img.height

      // Calculate constrained dimensions
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      // Draw onto offscreen canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable.'))
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Export as compressed JPEG data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }

    img.onload = processImage
    img.onerror = (err) => reject(new Error('Failed to load image for compression: ' + err))

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        img.src = reader.result as string
      }
      reader.onerror = (err) => reject(new Error('Failed to read image file: ' + err))
      reader.readAsDataURL(fileOrDataUrl)
    }
  })
}
