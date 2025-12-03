import { useEffect, useRef, useState } from 'react';
import { Clip } from './types';
import { formatTime } from './utils';
import { VideoTimeline } from './VideoTimeline';
import { VideoControls } from './VideoControls';
import { ClipsList } from './ClipsList';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { saveClipsToLocalStorage, loadClipsFromLocalStorage } from './localStorage';

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

      // Prevent default behavior for keys we're using
      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyI', 'KeyO', 'KeyD', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'Space':
          // Play/Pause
          if (isPlaying) {
            video.pause();
          } else {
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
  }, [isPlaying, currentClip, clips, playbackRate, videoSrc, videoFileName]);

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
        <video
          ref={videoRef}
          className="w-[70vw] h-auto"
          src={videoSrc || ''}
          controls={false}
        />
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
