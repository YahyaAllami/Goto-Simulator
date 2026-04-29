import { Play, Pause, SkipForward, RotateCcw, FastForward } from 'lucide-react';
import { Button, Label, Slider } from './ui';

interface Props {
  running: boolean;
  halted: boolean;
  canStep: boolean;
  speed: number;
  onSpeedChange: (v: number) => void;
  onReset: () => void;
  onStep: () => void;
  onRunPause: () => void;
  onRunToEnd: () => void;
}

export function ControlPanel({
  running,
  halted,
  canStep,
  speed,
  onSpeedChange,
  onReset,
  onStep,
  onRunPause,
  onRunToEnd,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={onReset} title="Reset (Strg/Cmd+R im Editor)">
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
      <Button variant="secondary" onClick={onStep} disabled={!canStep || halted} title="Schritt (F10)">
        <SkipForward className="h-4 w-4" />
        Schritt
      </Button>
      <Button onClick={onRunPause} disabled={halted && !running} title="Run/Pause (Strg/Cmd+Enter)">
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {running ? 'Pause' : 'Run'}
      </Button>
      <Button variant="secondary" onClick={onRunToEnd} disabled={halted} title="Sofortiger Lauf bis Ende">
        <FastForward className="h-4 w-4" />
        Bis Ende
      </Button>
      <div className="flex items-center gap-2">
        <Label htmlFor="speed">Tempo</Label>
        <Slider
          id="speed"
          min={1}
          max={100}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-40"
          aria-label="Ausfuehrungs-Tempo"
        />
      </div>
    </div>
  );
}
