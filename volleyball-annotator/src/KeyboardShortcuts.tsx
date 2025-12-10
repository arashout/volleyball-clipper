import { ACTION_LABELS } from './annotations';

function ButtonControl({
  keyboardKey,
  label,
}: {
  keyboardKey: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 font-mono">
      <span>{label}</span>
      <kbd className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-xs">{keyboardKey}</kbd>
    </div>
  );
}

export function KeyboardShortcuts() {
  return (
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
          <ButtonControl keyboardKey="D" label="Delete last/current clip" />
          <ButtonControl keyboardKey="S" label="Export clips JSON" />
        </div>
        <div className="flex flex-col gap-2">
          <ButtonControl keyboardKey="P" label="Toggle pose analysis" />
          {ACTION_LABELS.map((label, idx) => (
            <ButtonControl key={label} keyboardKey={String(idx + 1)} label={`Label: ${label}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
