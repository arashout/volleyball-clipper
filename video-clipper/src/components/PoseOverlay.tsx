import { useEffect, useRef } from 'react';
import { PersonPose, COCO_SKELETON_CONNECTIONS } from '../pose/types';

interface PoseOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseData: PersonPose[] | null;
  showBboxes?: boolean;
  showSkeletons?: boolean;
}

export function PoseOverlay({
  videoRef,
  poseData,
  showBboxes = true,
  showSkeletons = true
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updateDimensions = () => {
      const rect = video.getBoundingClientRect();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    updateDimensions();
    video.addEventListener('loadedmetadata', updateDimensions);
    window.addEventListener('resize', updateDimensions);

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [videoRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !poseData) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    poseData.forEach((person, idx) => {
      const color = getColorForPerson(idx);

      if (showBboxes) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(person.bbox.x, person.bbox.y, person.bbox.width, person.bbox.height);

        ctx.fillStyle = color;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(
          `Person ${idx + 1}: ${(person.bbox.confidence * 100).toFixed(1)}%`,
          person.bbox.x,
          person.bbox.y - 5
        );
      }

      if (showSkeletons) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        COCO_SKELETON_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = person.keypoints[startIdx];
          const end = person.keypoints[endIdx];

          if (start.confidence > 0.5 && end.confidence > 0.5) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          }
        });

        person.keypoints.forEach((kp) => {
          if (kp.confidence > 0.5) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
    });
  }, [poseData, showBboxes, showSkeletons]);

  const isPointInBoundingBox = (x: number, y: number): number | null => {
    if (!poseData) return null;

    for (let i = 0; i < poseData.length; i++) {
      const bbox = poseData[i].bbox;
      if (
        x >= bbox.x &&
        x <= bbox.x + bbox.width &&
        y >= bbox.y &&
        y <= bbox.y + bbox.height
      ) {
        return i;
      }
    }
    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !poseData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const personIndex = isPointInBoundingBox(clickX, clickY);
    if (personIndex === null) return;

    const person = poseData[personIndex];
    const bbox = person.bbox;

    alert(
      `Person ${personIndex + 1} clicked!\n\n` +
      `Bounding Box:\n` +
      `  Position: (${bbox.x.toFixed(1)}, ${bbox.y.toFixed(1)})\n` +
      `  Size: ${bbox.width.toFixed(1)} x ${bbox.height.toFixed(1)}\n` +
      `  Confidence: ${(bbox.confidence * 100).toFixed(1)}%\n\n` +
      `Keypoints: ${person.keypoints.length} detected\n` +
      `  Average confidence: ${(person.keypoints.reduce((sum, kp) => sum + kp.confidence, 0) / person.keypoints.length * 100).toFixed(1)}%`
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !poseData) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const personIndex = isPointInBoundingBox(mouseX, mouseY);
    canvas.style.cursor = personIndex !== null ? 'pointer' : 'default';
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      className="absolute top-0 left-0"
      style={{ zIndex: 10, cursor: 'default' }}
    />
  );
}

function getColorForPerson(idx: number): string {
  const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  return colors[idx % colors.length];
}
