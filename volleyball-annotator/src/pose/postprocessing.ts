import { PersonPose, Keypoint } from './types';

export function parseYOLOPoseOutput(
  output: Float32Array,
  originalWidth: number,
  originalHeight: number,
  inputSize: number = 640,
  confThreshold: number = 0.5,
  iouThreshold: number = 0.45
): PersonPose[] {
  const numDetections = 8400;

  const detections: Array<{
    x: number; y: number; w: number; h: number; conf: number;
    keypoints: Keypoint[];
  }> = [];

  for (let i = 0; i < numDetections; i++) {
    const cx = output[i];
    const cy = output[numDetections + i];
    const w = output[2 * numDetections + i];
    const h = output[3 * numDetections + i];
    const conf = output[4 * numDetections + i];

    if (conf < confThreshold) continue;

    const keypoints: Keypoint[] = [];
    for (let k = 0; k < 17; k++) {
      const kpX = output[(5 + k * 3) * numDetections + i];
      const kpY = output[(5 + k * 3 + 1) * numDetections + i];
      const kpConf = output[(5 + k * 3 + 2) * numDetections + i];

      keypoints.push({ x: kpX, y: kpY, confidence: kpConf });
    }

    detections.push({ x: cx, y: cy, w, h, conf, keypoints });
  }

  const nmsResults = applyNMS(detections, iouThreshold);

  const scale = Math.min(inputSize / originalWidth, inputSize / originalHeight);
  const xOffset = (inputSize - originalWidth * scale) / 2;
  const yOffset = (inputSize - originalHeight * scale) / 2;

  return nmsResults.map(det => {
    const bboxX = ((det.x - det.w / 2) - xOffset) / scale;
    const bboxY = ((det.y - det.h / 2) - yOffset) / scale;
    const bboxW = det.w / scale;
    const bboxH = det.h / scale;

    const scaledKeypoints = det.keypoints.map(kp => ({
      x: (kp.x - xOffset) / scale,
      y: (kp.y - yOffset) / scale,
      confidence: kp.confidence
    }));

    return {
      bbox: { x: bboxX, y: bboxY, width: bboxW, height: bboxH, confidence: det.conf },
      keypoints: scaledKeypoints
    };
  });
}

function applyNMS(
  detections: Array<{ x: number; y: number; w: number; h: number; conf: number; keypoints: Keypoint[] }>,
  iouThreshold: number
): typeof detections {
  const sorted = [...detections].sort((a, b) => b.conf - a.conf);
  const keep: typeof detections = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    keep.push(current);

    for (let i = sorted.length - 1; i >= 0; i--) {
      const iou = calculateIoU(current, sorted[i]);
      if (iou > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }

  return keep;
}

function calculateIoU(
  box1: { x: number; y: number; w: number; h: number },
  box2: { x: number; y: number; w: number; h: number }
): number {
  const x1 = Math.max(box1.x - box1.w / 2, box2.x - box2.w / 2);
  const y1 = Math.max(box1.y - box1.h / 2, box2.y - box2.h / 2);
  const x2 = Math.min(box1.x + box1.w / 2, box2.x + box2.w / 2);
  const y2 = Math.min(box1.y + box1.h / 2, box2.y + box2.h / 2);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = box1.w * box1.h;
  const area2 = box2.w * box2.h;
  const union = area1 + area2 - intersection;

  return intersection / union;
}
