import { useRef } from 'react';
import { ACTION_LABELS } from './annotations';
import { useVideoPlayer } from './useVideoPlayer';

const LABEL_COLORS: Record<string, string> = {
  ball: '#f59e0b',
  block: '#ef4444',
  receive: '#22c55e',
  set: '#3b82f6',
  spike: '#a855f7',
  serve: '#ec4899',
};

export function VideoTimeline() {
  const { currentTime, duration, clips, actionAnnotations, seekToTime } = useVideoPlayer();
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    seekToTime(Math.max(0, Math.min(duration, time)));
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      <div
        ref={timelineRef}
        onClick={handleClick}
        className="relative h-8 bg-gray-900 rounded cursor-pointer"
      >
        <div
          className="absolute h-full bg-white rounded transition-all"
          style={{ width: `${progressPercentage}%` }}
        />

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

        {actionAnnotations.map((annotation, index) => {
          if (duration === 0) return null;
          const posPercent = (annotation.time / duration) * 100;
          const color = LABEL_COLORS[annotation.label] || '#ffffff';

          return (
            <div
              key={index}
              className="absolute top-0 w-2 h-full"
              style={{
                left: `${posPercent}%`,
                backgroundColor: color,
                transform: 'translateX(-50%)',
              }}
              title={`${annotation.label} @ ${annotation.time.toFixed(2)}s`}
            />
          );
        })}

        <div
          className="absolute top-0 w-1 h-full bg-white"
          style={{ left: `${progressPercentage}%` }}
        />
      </div>

      {actionAnnotations.length > 0 && (
        <div className="flex gap-3 text-xs mt-1">
          {ACTION_LABELS.map((label) => {
            const count = actionAnnotations.filter(a => a.label === label).length;
            if (count === 0) return null;
            return (
              <div key={label} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: LABEL_COLORS[label] }}
                />
                <span>{label}: {count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
