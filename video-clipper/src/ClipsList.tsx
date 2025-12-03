import { Clip } from './types';
import { formatTime } from './utils';

interface ClipsListProps {
  clips: Clip[];
  onExport: () => void;
  onClear: () => void;
  onDelete: (index: number) => void;
  onSeek: (time: number) => void;
}

export function ClipsList({ clips, onExport, onClear, onDelete, onSeek }: ClipsListProps) {
  if (clips.length === 0) return null;

  return (
    <div className="border-t border-gray-700 pt-6">
      <h3 className="pb-2 text-lg">Clips ({clips.length})</h3>
      <div className="flex gap-2 pb-4">
        <button
          onClick={onExport}
          className="bg-white text-black border-none px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-300"
        >
          Export Clips JSON
        </button>
        <button
          onClick={onClear}
          className="bg-gray-900 text-white border border-gray-700 px-5 py-2.5 rounded cursor-pointer font-bold hover:bg-gray-950"
        >
          Clear All
        </button>
      </div>
      <ul className="list-none p-0 space-y-2">
        {[...clips].reverse().map((clip, reversedIndex) => {
          const originalIndex = clips.length - 1 - reversedIndex;
          return (
            <li key={originalIndex} className="flex justify-between items-center p-2 bg-gray-900 rounded font-mono text-sm">
              <span
                onClick={() => onSeek(clip.startTime)}
                className="cursor-pointer hover:text-gray-300"
              >
                Clip {originalIndex + 1}: {formatTime(clip.startTime)} → {formatTime(clip.endTime!)}
                {' '}({formatTime((clip.endTime! - clip.startTime))} duration)
              </span>
              <button
                onClick={() => onDelete(originalIndex)}
                className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded text-xs cursor-pointer hover:bg-gray-700"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
