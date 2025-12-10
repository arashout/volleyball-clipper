import { Clip, ActionAnnotation } from './types';

const STORAGE_PREFIX = 'video_data_';
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

export interface VideoData {
  clips: Clip[];
  annotations: ActionAnnotation[];
}

interface StoredVideoData extends VideoData {
  timestamp: number;
}

export const saveVideoData = (videoName: string, data: VideoData) => {
  const stored: StoredVideoData = {
    ...data,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_PREFIX + videoName, JSON.stringify(stored));
};

export const loadVideoData = (videoName: string): VideoData | null => {
  const stored = localStorage.getItem(STORAGE_PREFIX + videoName);
  if (!stored) return null;

  try {
    const data: StoredVideoData = JSON.parse(stored);
    const age = Date.now() - data.timestamp;

    if (age > STORAGE_TTL) {
      localStorage.removeItem(STORAGE_PREFIX + videoName);
      return null;
    }

    return { clips: data.clips, annotations: data.annotations };
  } catch (error) {
    console.error('Error loading video data from localStorage:', error);
    return null;
  }
};
