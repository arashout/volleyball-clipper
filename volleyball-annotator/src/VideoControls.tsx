import { formatTime } from './utils';
import { useVideoPlayer } from './useVideoPlayer';

export function VideoControls() {
  const {
    currentTime,
    duration,
    playbackRate,
    isMuted,
    toggleMute,
    openFilePicker,
    openClipsPicker,
    continuousPoseAnalysis,
    setContinuousPoseAnalysis,
    clearPoseOverlay,
    slowOnPendingLabel,
    setSlowOnPendingLabel,
    showSkeletons,
    setShowSkeletons,
    showLabels,
    setShowLabels,
  } = useVideoPlayer();

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
            onClick={toggleMute}
            className="bg-gray-700 text-white border border-gray-600 px-3 py-1.5 rounded cursor-pointer font-bold hover:bg-gray-600"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openFilePicker}
            className="bg-white text-black border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-300"
          >
            Load Video
          </button>
          <button
            onClick={openClipsPicker}
            className="bg-gray-700 text-white border border-gray-600 px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-600"
          >
            Load Clips
          </button>
          <button
            onClick={() => {
              if (continuousPoseAnalysis) {
                clearPoseOverlay();
              }
              setContinuousPoseAnalysis(!continuousPoseAnalysis);
            }}
            className={`border-none px-5 py-2.5 rounded cursor-pointer font-bold ${
              continuousPoseAnalysis
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Pose Detection: {continuousPoseAnalysis ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      <div className="flex gap-4 items-center text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={slowOnPendingLabel}
            onChange={() => setSlowOnPendingLabel(!slowOnPendingLabel)}
            className="w-4 h-4"
          />
          Slow on label select
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showSkeletons}
            onChange={() => setShowSkeletons(!showSkeletons)}
            className="w-4 h-4"
          />
          Show skeletons
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={() => setShowLabels(!showLabels)}
            className="w-4 h-4"
          />
          Show labels
        </label>
      </div>
    </div>
  );
}
