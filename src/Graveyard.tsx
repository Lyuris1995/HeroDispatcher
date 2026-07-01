interface GraveyardProps {
  deadHeroes: any[];
}

export default function Graveyard({ deadHeroes }: GraveyardProps) {
  if (deadHeroes.length === 0) return null;

  return (
    <div className="graveyard-section">
      <h2>🪦 Gefallene Helden</h2>
      <div className="graveyard-list">
        {deadHeroes.map(hero => (
          <div key={hero.id} className="grave-card">
            <img src={hero.image} alt={hero.name} className="grave-img" />
            <div className="grave-info">
              <h4>{hero.name}</h4>
              <p>Power: {hero.power}</p>
              {/* <span>Ruhe in Frieden</span> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}