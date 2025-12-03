import { useEffect, useRef, useState } from 'react';

interface Clip {
  startTime: number;
  endTime: number | null;
}

function ButtonControl({
  keyboardKey,
  label,
}: {
  keyboardKey: string;
  label: string;
}){
  return <div className="flex items-center gap-2 font-mono">
    <span>{label}</span>
    <kbd className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-xs">{keyboardKey}</kbd>
  </div>
}

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  clips: Clip[];
  onSeek: (time: number) => void;
}

function VideoTimeline({ currentTime, duration, clips, onSeek }: VideoTimelineProps) {
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

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

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
      if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyI', 'KeyO', 'KeyS'].includes(e.code)) {
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
          // Mark clip end
          if (currentClip && currentClip.endTime === null) {
            const completedClip = { ...currentClip, endTime: video.currentTime };
            setClips([...clips, completedClip]);
            setCurrentClip(null);
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
  }, [isPlaying, currentClip, clips, playbackRate, videoSrc]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const exportClips = () => {
    const data = JSON.stringify(clips, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clips.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearClips = () => {
    setClips([]);
  };

  const deleteClip = (index: number) => {
    setClips(clips.filter((_, i) => i !== index));
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
      // Reset clips when loading new video
      setClips([]);
      setCurrentClip(null);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
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
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="px-2"> / </span>
            <span>{formatTime(duration)}</span>
            <span className="text-lg pl-5"> {playbackRate}x</span>
          </div>
          <button
            onClick={openFilePicker}
            className="bg-white text-black border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-300"
          >
            Load Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

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

        <div className="flex flex-col w-full items-center">
          <h3 className="pb-2 text-lg">Keyboard Shortcuts</h3>
          <div className="flex gap-8 flex-wrap text-sm">
            <div className="flex flex-col gap-2">
              <ButtonControl keyboardKey="←" label="Back 1 frame" />
              <ButtonControl keyboardKey="J" label="Back 5 seconds" />
            </div>
            <div className="flex flex-col gap-2">
              <ButtonControl keyboardKey="→" label="Forward 1 frame" />
              <ButtonControl keyboardKey="L" label="Forward 5 seconds" />
            </div>
            <div className="flex flex-col gap-2">
              <ButtonControl keyboardKey="Space" label="Play/Pause" />
              <ButtonControl keyboardKey="," label="Slower (0.25x)" />
              <ButtonControl keyboardKey="." label="Faster (0.25x)" />
            </div>
            <div className="flex flex-col gap-2">
              <ButtonControl keyboardKey="I" label="Mark clip start" />
              <ButtonControl keyboardKey="O" label="Mark clip end" />
            </div>
          </div>
        </div>

        {clips.length > 0 && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="pb-2 text-lg">Clips ({clips.length})</h3>
            <div className="flex gap-2 pb-4">
              <button
                onClick={exportClips}
                className="bg-white text-black border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-300"
              >
                Export Clips JSON
              </button>
              <button
                onClick={clearClips}
                className="bg-gray-900 text-white border border-gray-700 px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-950"
              >
                Clear All
              </button>
            </div>
            <ul className="list-none p-0 space-y-2">
              {clips.map((clip, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-900 rounded font-mono text-sm">
                  <span>
                    Clip {index + 1}: {formatTime(clip.startTime)} → {formatTime(clip.endTime!)}
                    {' '}({formatTime((clip.endTime! - clip.startTime))} duration)
                  </span>
                  <button
                    onClick={() => deleteClip(index)}
                    className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded text-xs cursor-pointer hover:bg-gray-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
