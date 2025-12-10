import { formatTime } from './utils';

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onLoadVideo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadClips: () => void;
  clipsInputRef: React.RefObject<HTMLInputElement | null>;
  onClipsSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzePose?: () => void;
  isAnalyzing?: boolean;
  slowOnPendingLabel: boolean;
  onToggleSlowOnPendingLabel: () => void;
  showSkeletons: boolean;
  onToggleShowSkeletons: () => void;
  showLabels: boolean;
  onToggleShowLabels: () => void;
}

export function VideoControls({
  currentTime,
  duration,
  playbackRate,
  isMuted,
  onToggleMute,
  onLoadVideo,
  fileInputRef,
  onFileSelect,
  onLoadClips,
  clipsInputRef,
  onClipsSelect,
  onAnalyzePose,
  isAnalyzing = false,
  slowOnPendingLabel,
  onToggleSlowOnPendingLabel,
  showSkeletons,
  onToggleShowSkeletons,
  showLabels,
  onToggleShowLabels,
}: VideoControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="px-2"> / </span>
            <span>{formatTime(duration)}</span>
            <span className="text-lg pl-5"> {playbackRate}x</span>
          </div>
          <button
            onClick={onToggleMute}
            className="bg-gray-700 text-white border border-gray-600 px-3 py-1.5 rounded cursor-pointer font-bold hover:bg-gray-600"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
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
          {onAnalyzePose && (
            <button
              onClick={onAnalyzePose}
              disabled={isAnalyzing}
              className="bg-blue-600 text-white border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Pose'}
            </button>
          )}
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
      <div className="flex gap-4 items-center text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={slowOnPendingLabel}
            onChange={onToggleSlowOnPendingLabel}
            className="w-4 h-4"
          />
          Slow on label select
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showSkeletons}
            onChange={onToggleShowSkeletons}
            className="w-4 h-4"
          />
          Show skeletons
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={onToggleShowLabels}
            className="w-4 h-4"
          />
          Show labels
        </label>
      </div>
    </div>
  );
}
