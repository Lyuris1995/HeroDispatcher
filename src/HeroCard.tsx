// Wir definieren, wie ein "Hero" aussieht
interface HeroProps {
  hero: {
    id: number;
    name: string;
    type: string;
    power: number;
    status: string;
    image: string;
    timer: number;
    maxTimer: number;
  };
  onSelect: () => void;
  isSelected: boolean;
}

// Die Komponente nimmt "props" entgegen (wir destrukturieren sie direkt zu { hero })
function HeroCard({ hero, onSelect, isSelected }: HeroProps) {
  const maxTime = hero.maxTimer;
  const progressWidth = (hero.timer / maxTime) * 100;
  var progressBarColor = ""

  if(hero.timer >= 10) {
    progressBarColor = "var(--theme-dark-color)"
  }
  else if(hero.timer > 3) {
    progressBarColor = "var(--theme-color)"
  }
  else if(hero.timer <= 3) {
    progressBarColor = "var(--theme-light-color)"
  }

  return (
    <div className={`hero-card ${isSelected ? 'selected' : ''} ${hero.status}`} onClick={() => onSelect(hero.id)}>
      {hero.image ? (
        <img className="hero-img" src={hero.image} alt={hero.name} />
        ) : (
        <div className="placeholder">Kein Bild verfügbar</div>
        )}
      <h3>{hero.name}</h3>
      <p>Type: {hero.type}</p>
      <p>Power: {hero.power}</p>
      <p className={`status-${hero.status.toLowerCase()}`}>
        Status: {hero.status}
      </p>
        <div className="timer-container">
          <div 
            className="timer-bar" 
            style={{ width: `${progressWidth}%`, backgroundColor: `${progressBarColor}`}}
          >
          </div>
          <span className="timer-text">{hero.timer}s</span>
        </div>
    </div>
  );
}

export default HeroCard;