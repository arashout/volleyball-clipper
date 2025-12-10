import { useEffect } from 'react';
import { formatTime } from './utils';
import { VideoTimeline } from './VideoTimeline';
import { VideoControls } from './VideoControls';
import { ClipsList } from './ClipsList';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { PoseOverlay } from './components/PoseOverlay';
import { ACTION_LABELS } from './annotations';
import { VideoPlayerProvider } from './VideoPlayerContext';
import { useVideoPlayer } from './useVideoPlayer';

function VideoPlayerInner() {
  const {
    videoRef,
    fileInputRef,
    clipsInputRef,
    isPlaying,
    playbackRate,
    setPlaybackRate,
    videoSrc,
    videoFileName,
    clips,
    currentClip,
    setCurrentClip,
    addClip,
    poseData,
    isAnalyzing,
    setContinuousPoseAnalysis,
    handlePoseAnalysis,
    clearPoseOverlay,
    pendingLabel,
    setPendingLabel,
    handleFileSelect,
    handleClipsLoad,
  } = useVideoPlayer();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || !videoSrc) return;

      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyI', 'KeyO', 'KeyD', 'KeyS', 'KeyP', 'Escape', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Escape') {
        if (pendingLabel) {
          setPendingLabel(null);
        }
        return;
      }

      if (e.code === 'Space' && pendingLabel) {
        setPendingLabel(null);
        video.play();
        return;
      }

      if (e.code.startsWith('Digit')) {
        const labelIndex = parseInt(e.code.replace('Digit', '')) - 1;
        if (labelIndex >= 0 && labelIndex < ACTION_LABELS.length) {
          const label = ACTION_LABELS[labelIndex];
          setPendingLabel(label);
          if (!isAnalyzing && !poseData) {
            handlePoseAnalysis();
          }
          return;
        }
      }

      switch (e.code) {
        case 'Space':
          if (isPlaying) {
            video.pause();
          } else {
            video.play();
          }
          break;

        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 0.033);
          break;

        case 'ArrowRight':
          video.currentTime = Math.min(video.duration, video.currentTime + 0.033);
          break;

        case 'KeyJ':
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;

        case 'KeyL':
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;

        case 'KeyI':
          setCurrentClip({ startTime: video.currentTime, endTime: null });
          break;

        case 'KeyO':
          if (currentClip && currentClip.endTime === null) {
            const completedClip = { ...currentClip, endTime: video.currentTime };
            addClip(completedClip);
            setCurrentClip(null);
          }
          break;

        case 'KeyD':
          if (currentClip) {
            setCurrentClip(null);
          }
          break;

        case 'KeyP':
          setContinuousPoseAnalysis(prev => {
            if (prev) clearPoseOverlay();
            return !prev;
          });
          break;

        case 'Comma': {
          const newSlowerRate = Math.max(0.25, playbackRate - 0.25);
          setPlaybackRate(newSlowerRate);
          break;
        }

        case 'Period': {
          const newFasterRate = Math.min(2, playbackRate + 0.25);
          setPlaybackRate(newFasterRate);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentClip, clips, playbackRate, videoSrc, videoFileName, isAnalyzing, pendingLabel, poseData, handlePoseAnalysis, setPendingLabel, setCurrentClip, addClip, setContinuousPoseAnalysis, setPlaybackRate, videoRef]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 flex justify-center items-center bg-black p-4">
        {!videoSrc && (
          <div className="absolute text-white text-xl">No video loaded. Please load a video.</div>
        )}
        <div className="relative" style={{ width: '70vw' }}>
          <video
            ref={videoRef}
            className="max-w-full w-full max-h-[80vh]"
            src={videoSrc || ''}
            controls={false}
          />
          <PoseOverlay />
        </div>
      </div>

      <div className="p-6 bg-gray-800 overflow-y-auto space-y-6">
        <VideoControls />

        <VideoTimeline />

        {currentClip && (
          <div className="bg-white text-black p-3 rounded font-bold">
            Clip start: {formatTime(currentClip.startTime)} (Press 'O' to mark end)
          </div>
        )}

        <div className="flex gap-2 items-center">
          <span className="text-sm">Labels:</span>
          {ACTION_LABELS.map((label, idx) => (
            <button
              key={label}
              onClick={() => {
                setPendingLabel(label);
                if (!isAnalyzing && !poseData) {
                  handlePoseAnalysis();
                }
              }}
              className={`px-3 py-1 rounded text-sm font-mono ${
                pendingLabel === label
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {idx + 1}: {label}
            </button>
          ))}
          {pendingLabel && (
            <span className="ml-4 text-yellow-400 font-bold">
              Click a person or draw a box to label as "{pendingLabel}"
            </span>
          )}
        </div>

        <KeyboardShortcuts />

        {poseData && poseData.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="pb-2 text-lg">Pose Analysis ({poseData.length} persons detected)</h3>
            <div className="flex gap-2">
              <button
                onClick={clearPoseOverlay}
                className="bg-gray-900 text-white border border-gray-700 px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-950"
              >
                Clear Overlay
              </button>
            </div>
          </div>
        )}

        <ClipsList />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={clipsInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleClipsLoad}
        className="hidden"
      />
    </div>
  );
}

export function VideoPlayer() {
  return (
    <VideoPlayerProvider>
      <VideoPlayerInner />
    </VideoPlayerProvider>
  );
}
