import { useContext, useEffect, useCallback } from 'react';
import { VideoPlayerContext, VideoPlayerContextType } from './VideoPlayerContext';
import { Clip, ActionAnnotation } from './types';
import { saveVideoData, loadVideoData } from './localStorage';
import { annotationsToYOLO } from './annotations';

export interface UseVideoPlayerReturn extends VideoPlayerContextType {
  toggleMute: () => void;
  addClip: (clip: Clip) => void;
  deleteClip: (index: number) => void;
  clearClips: () => void;
  exportData: () => void;
  clearPoseOverlay: () => void;
  addActionAnnotation: (annotation: ActionAnnotation) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClipsLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFilePicker: () => void;
  openClipsPicker: () => void;
  seekToTime: (time: number) => void;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  }

  const {
    videoRef,
    poseCanvasRef,
    fileInputRef,
    clipsInputRef,
    videoSrc,
    setVideoSrc,
    videoFileName,
    setVideoFileName,
    isMuted,
    setIsMuted,
    clips,
    setClips,
    setCurrentClip,
    setPoseData,
    pendingLabel,
    setPendingLabel,
    slowOnPendingLabel,
    playbackRate,
    actionAnnotations,
    setActionAnnotations,
  } = context;

  const saveData = useCallback((newClips: Clip[], newAnnotations: ActionAnnotation[]) => {
    saveVideoData(videoFileName, { clips: newClips, annotations: newAnnotations });
  }, [videoFileName]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (pendingLabel && slowOnPendingLabel) {
      video.playbackRate = 0.25;
      video.play();
    } else {
      video.playbackRate = playbackRate;
    }
  }, [pendingLabel, slowOnPendingLabel, playbackRate, videoRef]);

  const clearPoseOverlay = useCallback(() => {
    setPoseData(null);
    setPendingLabel(null);
    const canvas = poseCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [setPoseData, setPendingLabel, poseCanvasRef]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [videoRef, isMuted, setIsMuted]);

  const addClip = useCallback((clip: Clip) => {
    const newClips = [...clips, clip];
    setClips(newClips);
    saveData(newClips, actionAnnotations);
  }, [clips, setClips, actionAnnotations, saveData]);

  const deleteClip = useCallback((index: number) => {
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
    saveData(newClips, actionAnnotations);
  }, [clips, setClips, actionAnnotations, saveData]);

  const clearClips = useCallback(() => {
    setClips([]);
    saveData([], actionAnnotations);
  }, [setClips, actionAnnotations, saveData]);

  const exportData = useCallback(() => {
    const video = videoRef.current;
    const videoWidth = video?.videoWidth || 1;
    const videoHeight = video?.videoHeight || 1;

    const exportObj = {
      clips,
      annotationsYOLO: annotationsToYOLO(actionAnnotations, videoWidth, videoHeight),
      annotations: actionAnnotations,
    };

    const data = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoFileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [clips, actionAnnotations, videoFileName, videoRef]);

  const addActionAnnotation = useCallback((annotation: ActionAnnotation) => {
    setActionAnnotations(prev => {
      const newAnnotations = [...prev, annotation];
      saveData(clips, newAnnotations);
      return newAnnotations;
    });
  }, [setActionAnnotations, clips, saveData]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setVideoFileName(nameWithoutExt);
      const savedData = loadVideoData(nameWithoutExt);
      if (savedData) {
        setClips(savedData.clips);
        setActionAnnotations(savedData.annotations);
      } else {
        setClips([]);
        setActionAnnotations([]);
      }
      setCurrentClip(null);
    }
  }, [videoSrc, setVideoSrc, setVideoFileName, setClips, setCurrentClip, setActionAnnotations]);

  const handleClipsLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [setClips]);

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), [fileInputRef]);
  const openClipsPicker = useCallback(() => clipsInputRef.current?.click(), [clipsInputRef]);

  const seekToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, [videoRef]);

  return {
    ...context,
    toggleMute,
    addClip,
    deleteClip,
    clearClips,
    exportData,
    clearPoseOverlay,
    addActionAnnotation,
    handleFileSelect,
    handleClipsLoad,
    openFilePicker,
    openClipsPicker,
    seekToTime,
  };
}
