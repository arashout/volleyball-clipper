import { Clip } from './types';

const CLIPS_STORAGE_PREFIX = 'clips_';
const CLIPS_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

interface StoredClips {
  clips: Clip[];
  timestamp: number;
}

export const saveClipsToLocalStorage = (videoName: string, clips: Clip[]) => {
  const data: StoredClips = {
    clips,
    timestamp: Date.now(),
  };
  localStorage.setItem(CLIPS_STORAGE_PREFIX + videoName, JSON.stringify(data));
};

export const loadClipsFromLocalStorage = (videoName: string): Clip[] | null => {
  const stored = localStorage.getItem(CLIPS_STORAGE_PREFIX + videoName);
  if (!stored) return null;

  try {
    const data: StoredClips = JSON.parse(stored);
    const age = Date.now() - data.timestamp;

    // Check if data is expired
    if (age > CLIPS_TTL) {
      localStorage.removeItem(CLIPS_STORAGE_PREFIX + videoName);
      return null;
    }

    return data.clips;
  } catch (error) {
    console.error('Error loading clips from localStorage:', error);
    return null;
  }
};
