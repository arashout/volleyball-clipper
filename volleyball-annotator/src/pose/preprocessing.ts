export interface PreprocessResult {
  tensor: Float32Array;
  originalWidth: number;
  originalHeight: number;
}

export async function captureVideoFrame(
  videoElement: HTMLVideoElement
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(videoElement, 0, 0);

  return canvas;
}

export function preprocessFrame(
  canvas: HTMLCanvasElement,
  inputSize: number = 640
): PreprocessResult {
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = inputSize;
  tempCanvas.height = inputSize;
  const tempCtx = tempCanvas.getContext('2d')!;

  const scale = Math.min(inputSize / originalWidth, inputSize / originalHeight);
  const scaledWidth = originalWidth * scale;
  const scaledHeight = originalHeight * scale;
  const xOffset = (inputSize - scaledWidth) / 2;
  const yOffset = (inputSize - scaledHeight) / 2;

  tempCtx.fillStyle = '#727272';
  tempCtx.fillRect(0, 0, inputSize, inputSize);

  tempCtx.drawImage(canvas, 0, 0, originalWidth, originalHeight,
                    xOffset, yOffset, scaledWidth, scaledHeight);

  const imageData = tempCtx.getImageData(0, 0, inputSize, inputSize);
  const pixels = imageData.data;

  const tensor = new Float32Array(3 * inputSize * inputSize);
  for (let i = 0; i < inputSize * inputSize; i++) {
    tensor[i] = pixels[i * 4] / 255;
    tensor[inputSize * inputSize + i] = pixels[i * 4 + 1] / 255;
    tensor[2 * inputSize * inputSize + i] = pixels[i * 4 + 2] / 255;
  }

  return { tensor, originalWidth, originalHeight };
}
