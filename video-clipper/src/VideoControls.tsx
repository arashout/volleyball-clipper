import { formatTime } from './utils';

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  onLoadVideo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadClips: () => void;
  clipsInputRef: React.RefObject<HTMLInputElement | null>;
  onClipsSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function VideoControls({
  currentTime,
  duration,
  playbackRate,
  onLoadVideo,
  fileInputRef,
  onFileSelect,
  onLoadClips,
  clipsInputRef,
  onClipsSelect,
}: VideoControlsProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="text-2xl font-bold font-mono">
        <span>{formatTime(currentTime)}</span>
        <span className="px-2"> / </span>
        <span>{formatTime(duration)}</span>
        <span className="text-lg pl-5"> {playbackRate}x</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onLoadVideo}
          className="bg-white text-black border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-300"
        >
          Load Video
        </button>
        <button
          onClick={onLoadClips}
          className="bg-gray-700 text-white border border-gray-600 px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-600"
        >
          Load Clips
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={onFileSelect}
        className="hidden"
      />
      <input
        ref={clipsInputRef}
        type="file"
        accept="application/json,.json"
        onChange={onClipsSelect}
        className="hidden"
      />
    </div>
  );
}
