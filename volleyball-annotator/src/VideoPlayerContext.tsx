import { createContext, useState, useRef, useEffect, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import { Clip, ActionAnnotation } from './types';
import { PersonPose } from './pose/types';
import { loadModel, runInference } from './pose/onnxInference';
import { captureVideoFrame, preprocessFrame } from './pose/preprocessing';
import { parseYOLOPoseOutput } from './pose/postprocessing';

export interface VideoPlayerContextType {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  clipsInputRef: React.RefObject<HTMLInputElement | null>;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  videoSrc: string | null;
  setVideoSrc: Dispatch<SetStateAction<string | null>>;
  videoFileName: string;
  setVideoFileName: Dispatch<SetStateAction<string>>;

  isMuted: boolean;
  setIsMuted: Dispatch<SetStateAction<boolean>>;

  clips: Clip[];
  setClips: Dispatch<SetStateAction<Clip[]>>;
  currentClip: Clip | null;
  setCurrentClip: Dispatch<SetStateAction<Clip | null>>;

  poseData: PersonPose[] | null;
  setPoseData: Dispatch<SetStateAction<PersonPose[] | null>>;
  isAnalyzing: boolean;
  continuousPoseAnalysis: boolean;
  setContinuousPoseAnalysis: Dispatch<SetStateAction<boolean>>;
  handlePoseAnalysis: () => Promise<void>;

  pendingLabel: string | null;
  setPendingLabel: Dispatch<SetStateAction<string | null>>;
  actionAnnotations: ActionAnnotation[];
  setActionAnnotations: Dispatch<SetStateAction<ActionAnnotation[]>>;

  slowOnPendingLabel: boolean;
  setSlowOnPendingLabel: Dispatch<SetStateAction<boolean>>;
  showSkeletons: boolean;
  setShowSkeletons: Dispatch<SetStateAction<boolean>>;
  showLabels: boolean;
  setShowLabels: Dispatch<SetStateAction<boolean>>;
}

export const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clipsInputRef = useRef<HTMLInputElement>(null);
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('clips');
  const [poseData, setPoseData] = useState<PersonPose[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [continuousPoseAnalysis, setContinuousPoseAnalysis] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [actionAnnotations, setActionAnnotations] = useState<ActionAnnotation[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [slowOnPendingLabel, setSlowOnPendingLabel] = useState(true);
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedVideo = () => {
      setDuration(video.duration);
      setCurrentTime(0);
      setPlaybackRateState(1);
      video.playbackRate = 1;
    };

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

  const handlePoseAnalysis = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !videoSrc || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      await loadModel('/volleyball-annotator/models/yolo11n-pose.onnx');
      const canvas = await captureVideoFrame(video);
      const { tensor, originalWidth, originalHeight } = preprocessFrame(canvas);
      const output = await runInference(tensor);
      const persons = parseYOLOPoseOutput(output, originalWidth, originalHeight);
      setPoseData(persons.length > 0 ? persons : null);
    } catch (error) {
      console.error('Pose analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoSrc, isAnalyzing]);

  useEffect(() => {
    if (!continuousPoseAnalysis || !videoSrc || isAnalyzing) return;

    handlePoseAnalysis();

    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
      if (continuousPoseAnalysis && !isAnalyzing) {
        handlePoseAnalysis();
      }
    };

    video.addEventListener('seeked', handleSeeked);
    return () => video.removeEventListener('seeked', handleSeeked);
  }, [continuousPoseAnalysis, videoSrc, currentTime, isAnalyzing, handlePoseAnalysis]);

  const value: VideoPlayerContextType = {
    videoRef,
    poseCanvasRef,
    fileInputRef,
    clipsInputRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    setPlaybackRate,
    videoSrc,
    setVideoSrc,
    videoFileName,
    setVideoFileName,
    isMuted,
    setIsMuted,
    clips,
    setClips,
    currentClip,
    setCurrentClip,
    poseData,
    setPoseData,
    isAnalyzing,
    continuousPoseAnalysis,
    setContinuousPoseAnalysis,
    handlePoseAnalysis,
    pendingLabel,
    setPendingLabel,
    actionAnnotations,
    setActionAnnotations,
    slowOnPendingLabel,
    setSlowOnPendingLabel,
    showSkeletons,
    setShowSkeletons,
    showLabels,
    setShowLabels,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}
