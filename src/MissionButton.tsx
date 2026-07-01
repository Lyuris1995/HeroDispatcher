import { MissionConfig } from './App.tsx'

interface MissionButtonProps {
  config: MissionConfig;
  onLaunch: (mission: MissionConfig) => void;
  disabled: boolean;
}

export default function MissionButton({ config, onLaunch, disabled }: MissionButtonProps) {
  return (
    <button 
      className={`mission-btn btn-${config.difficulty}`}
      onClick={() => onLaunch(config)}
      disabled={disabled}
    >
      {config.label} ({config.duration}s)
    </button>
  );
}