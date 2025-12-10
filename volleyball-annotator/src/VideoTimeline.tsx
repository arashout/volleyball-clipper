import { useRef } from 'react';
import { Clip } from './types';

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  clips: Clip[];
  onSeek: (time: number) => void;
}

export function VideoTimeline({ currentTime, duration, clips, onSeek }: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    onSeek(Math.max(0, Math.min(duration, time)));
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      <div
        ref={timelineRef}
        onClick={handleClick}
        className="relative h-8 bg-gray-900 rounded cursor-pointer"
      >
        {/* Progress bar */}
        <div
          className="absolute h-full bg-white rounded transition-all"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Clip markers */}
        {clips.map((clip, index) => {
          if (!clip.endTime || duration === 0) return null;
          const startPercent = (clip.startTime / duration) * 100;
          const endPercent = (clip.endTime / duration) * 100;
          const width = endPercent - startPercent;

          return (
            <div
              key={index}
              className="absolute h-full bg-gray-500 opacity-50"
              style={{
                left: `${startPercent}%`,
                width: `${width}%`,
              }}
            />
          );
        })}

        {/* Current time indicator */}
        <div
          className="absolute top-0 w-1 h-full bg-white"
          style={{ left: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
