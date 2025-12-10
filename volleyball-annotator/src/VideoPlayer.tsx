import { useEffect, useRef, useState } from 'react';
import { Clip } from './types';
import { formatTime } from './utils';
import { VideoTimeline } from './VideoTimeline';
import { VideoControls } from './VideoControls';
import { ClipsList } from './ClipsList';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { saveClipsToLocalStorage, loadClipsFromLocalStorage } from './localStorage';
import { PoseOverlay } from './components/PoseOverlay';
import { PersonPose } from './pose/types';
import { loadModel, runInference } from './pose/onnxInference';
import { captureVideoFrame, preprocessFrame } from './pose/preprocessing';
import { parseYOLOPoseOutput } from './pose/postprocessing';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clipsInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('clips');
  const [poseData, setPoseData] = useState<PersonPose[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLoadedVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);
    setCurrentTime(0);
    setPlaybackRate(1);
    video.playbackRate = 1;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedVideo);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedVideo);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoSrc]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || !videoSrc) return;

      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyI', 'KeyO', 'KeyD', 'KeyS', 'KeyP'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          if (isPlaying) {
            video.pause();
          } else {
            setPoseData(null);
            video.play();
          }
          break;

        case 'ArrowLeft':
          // Go back 1 frame (assuming 30fps = ~0.033s per frame)
          video.currentTime = Math.max(0, video.currentTime - 0.033);
          break;

        case 'ArrowRight':
          // Go forward 1 frame
          video.currentTime = Math.min(video.duration, video.currentTime + 0.033);
          break;

        case 'KeyJ':
          // Go back 5 seconds
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;

        case 'KeyL':
          // Go forward 5 seconds
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;

        case 'KeyI':
          // Mark clip start
          setCurrentClip({ startTime: video.currentTime, endTime: null });
          break;

        case 'KeyO':
          if (currentClip && currentClip.endTime === null) {
            const completedClip = { ...currentClip, endTime: video.currentTime };
            const newClips = [...clips, completedClip];
            setClips(newClips);
            setCurrentClip(null);
            saveClipsToLocalStorage(videoFileName, newClips);
          }
          break;

        case 'KeyD':
          if (currentClip) {
            setCurrentClip(null);
          } else if (clips.length > 0) {
            const newClips = clips.slice(0, -1);
            setClips(newClips);
          }
          break;

        case 'KeyS':
          exportClips();
          break;

        case 'KeyP':
          if (!isAnalyzing) {
            handlePoseAnalysis();
          }
          break;

        case 'Comma':
          // Decrease playback speed
          const newSlowerRate = Math.max(0.25, playbackRate - 0.25);
          setPlaybackRate(newSlowerRate);
          video.playbackRate = newSlowerRate;
          break;

        case 'Period':
          // Increase playback speed
          const newFasterRate = Math.min(2, playbackRate + 0.25);
          setPlaybackRate(newFasterRate);
          video.playbackRate = newFasterRate;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentClip, clips, playbackRate, videoSrc, videoFileName, isAnalyzing]);

  const exportClips = () => {
    const data = JSON.stringify(clips, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoFileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearClips = () => {
    setClips([]);
    saveClipsToLocalStorage(videoFileName, []);
  };

  const deleteClip = (index: number) => {
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
    saveClipsToLocalStorage(videoFileName, newClips);
  };

  const handlePoseAnalysis = async () => {
    const video = videoRef.current;
    if (!video || !videoSrc) {
      alert('Please load a video first');
      return;
    }

    setIsAnalyzing(true);
    try {
      await loadModel('/volleyball-annotator/models/yolo11n-pose.onnx');

      const canvas = await captureVideoFrame(video);
      const { tensor, originalWidth, originalHeight } = preprocessFrame(canvas);

      const startTime = performance.now();
      const output = await runInference(tensor);
      const inferenceTime = performance.now() - startTime;

      const persons = parseYOLOPoseOutput(output, originalWidth, originalHeight);

      if (persons.length === 0) {
        alert('No persons detected in this frame');
        setPoseData(null);
        return;
      }

      setPoseData(persons);
      console.log(`Detected ${persons.length} persons in ${inferenceTime.toFixed(0)}ms`);
    } catch (error) {
      console.error('Pose analysis failed:', error);
      alert('Pose analysis failed. Check console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportPoseData = () => {
    if (!poseData) {
      alert('No pose data to export');
      return;
    }

    const exportData = {
      videoFileName,
      analysisTimestamp: Date.now(),
      frameTime: videoRef.current?.currentTime || 0,
      results: {
        timestamp: Date.now(),
        frameTime: videoRef.current?.currentTime || 0,
        persons: poseData,
        inferenceTimeMs: 0
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoFileName}_pose_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearPoseOverlay = () => {
    setPoseData(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Revoke old object URL to prevent memory leaks
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      // Extract filename without extension
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setVideoFileName(nameWithoutExt);
      // Try to load clips from localStorage
      const savedClips = loadClipsFromLocalStorage(nameWithoutExt);
      if (savedClips) {
        setClips(savedClips);
      } else {
        setClips([]);
      }
      setCurrentClip(null);
    }
  };

  const handleClipsLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedClips = JSON.parse(event.target?.result as string);
          if (Array.isArray(loadedClips)) {
            setClips(loadedClips);
          }
        } catch (error) {
          console.error('Error parsing clips JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const openClipsPicker = () => {
    clipsInputRef.current?.click();
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 flex justify-center items-center bg-black p-8">
        {!videoSrc && (
          <div className="absolute text-white text-xl">No video loaded. Please load a video.</div>
        )}
        <div className="relative" style={{ width: '70vw' }}>
          <video
            ref={videoRef}
            className="w-full h-auto"
            src={videoSrc || ''}
            controls={false}
          />
          <PoseOverlay videoRef={videoRef} poseData={poseData} />
        </div>
      </div>

      <div className="p-6 bg-gray-800 max-h-[50vh] overflow-y-auto space-y-6">
        <VideoControls
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          onLoadVideo={openFilePicker}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onLoadClips={openClipsPicker}
          clipsInputRef={clipsInputRef}
          onClipsSelect={handleClipsLoad}
          onAnalyzePose={handlePoseAnalysis}
          isAnalyzing={isAnalyzing}
        />

        <VideoTimeline
          currentTime={currentTime}
          duration={duration}
          clips={clips}
          onSeek={seekToTime}
        />

        {currentClip && (
          <div className="bg-white text-black p-3 rounded font-bold">
            📍 Clip start: {formatTime(currentClip.startTime)} (Press 'O' to mark end)
          </div>
        )}

        <KeyboardShortcuts />

        {poseData && poseData.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="pb-2 text-lg">Pose Analysis ({poseData.length} persons detected)</h3>
            <div className="flex gap-2">
              <button
                onClick={exportPoseData}
                className="bg-white text-black border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-300"
              >
                Export Pose Data
              </button>
              <button
                onClick={clearPoseOverlay}
                className="bg-gray-900 text-white border border-gray-700 px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-950"
              >
                Clear Overlay
              </button>
            </div>
          </div>
        )}

        <ClipsList
          clips={clips}
          onExport={exportClips}
          onClear={clearClips}
          onDelete={deleteClip}
          onSeek={seekToTime}
        />
      </div>
    </div>
  );
}
