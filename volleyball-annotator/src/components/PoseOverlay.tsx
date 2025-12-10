import { useEffect, useState, useCallback } from 'react';
import { COCO_SKELETON_CONNECTIONS } from '../pose/types';
import { useVideoPlayer } from '../useVideoPlayer';

interface DrawingState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function PoseOverlay() {
  const {
    videoRef,
    poseCanvasRef: canvasRef,
    poseData,
    showSkeletons,
    showLabels,
    pendingLabel,
    setPendingLabel,
    addActionAnnotation,
  } = useVideoPlayer();

  const [drawing, setDrawing] = useState<DrawingState | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const updateDimensions = () => {
      const rect = video.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = video.videoWidth || rect.width;
      canvas.height = video.videoHeight || rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      console.log('Updated canvas dimensions', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
    };

    updateDimensions();
    video.addEventListener('loadedmetadata', updateDimensions);
    video.addEventListener('loadeddata', updateDimensions);
    video.addEventListener('canplay', updateDimensions);
    window.addEventListener('resize', updateDimensions);

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(video);

    return () => {
      video.removeEventListener('loadedmetadata', updateDimensions);
      video.removeEventListener('loadeddata', updateDimensions);
      video.removeEventListener('canplay', updateDimensions);
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, [videoRef, canvasRef]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref is null');
      return;
    }

    console.log('Drawing canvas', { width: canvas.width, height: canvas.height, poseData: poseData?.length });

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poseData) {
      const skeletonColor = 'rgba(0, 255, 0, 0.6)';
      const bboxColor = 'rgba(0, 100, 255, 0.9)';

      poseData.forEach((person, idx) => {
        console.log('Drawing person bbox', person.bbox);
        ctx.strokeStyle = bboxColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(person.bbox.x, person.bbox.y, person.bbox.width, person.bbox.height);

        if (showLabels) {
          ctx.fillStyle = bboxColor;
          ctx.font = 'bold 16px monospace';
          ctx.fillText(
            `Person ${idx + 1}: ${(person.bbox.confidence * 100).toFixed(1)}%`,
            person.bbox.x,
            person.bbox.y - 5
          );
        }

        if (showSkeletons) {
          ctx.strokeStyle = skeletonColor;
          ctx.lineWidth = 1;
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
              ctx.fillStyle = skeletonColor;
              ctx.beginPath();
              ctx.arc(kp.x, kp.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            }
          });
        }
      });
    }

    if (drawing) {
      const x = Math.min(drawing.startX, drawing.currentX);
      const y = Math.min(drawing.startY, drawing.currentY);
      const width = Math.abs(drawing.currentX - drawing.startX);
      const height = Math.abs(drawing.currentY - drawing.startY);

      ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  }, [poseData, showSkeletons, showLabels, drawing, canvasRef]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

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

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePersonClick = (personIndex: number) => {
    if (!pendingLabel || !poseData || !videoRef.current) return;

    const person = poseData[personIndex];
    addActionAnnotation({
      time: videoRef.current.currentTime,
      label: pendingLabel,
      bbox: {
        x: person.bbox.x,
        y: person.bbox.y,
        width: person.bbox.width,
        height: person.bbox.height,
      },
    });
    setPendingLabel(null);
  };

  const handleCustomBboxDraw = (bbox: { x: number; y: number; width: number; height: number }) => {
    if (!pendingLabel || !videoRef.current) return;

    addActionAnnotation({
      time: videoRef.current.currentTime,
      label: pendingLabel,
      bbox,
    });
    setPendingLabel(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pendingLabel) return;

    const { x, y } = getCanvasCoords(e);
    const personIndex = isPointInBoundingBox(x, y);

    if (personIndex !== null) {
      handlePersonClick(personIndex);
      return;
    }

    setDrawing({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoords(e);

    if (drawing) {
      setDrawing(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
      canvas.style.cursor = 'crosshair';
      return;
    }

    const personIndex = isPointInBoundingBox(x, y);
    if (pendingLabel) {
      canvas.style.cursor = 'crosshair';
    } else if (personIndex !== null) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseUp = () => {
    if (!drawing) {
      setDrawing(null);
      return;
    }

    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const width = Math.abs(drawing.currentX - drawing.startX);
    const height = Math.abs(drawing.currentY - drawing.startY);

    if (width > 5 && height > 5) {
      handleCustomBboxDraw({ x, y, width, height });
    }

    setDrawing(null);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="absolute top-0 left-0"
      style={{ zIndex: 10, cursor: pendingLabel ? 'crosshair' : 'default' }}
    />
  );
}
