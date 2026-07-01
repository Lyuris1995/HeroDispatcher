import { useState, useEffect } from 'react';
import hero_pool from './HeroPool.tsx';

export default function HeroShop({ onBuyHero, currentGold, onRefresh, ownedHeroIds }) {
const [offers, setOffers] = useState<any[]>([]);

  // Funktion, um 3 neue Helden zu finden, die man noch NICHT besitzt
  const generateNewOffers = () => {
    const availablePool = hero_pool.filter(h => !ownedHeroIds.includes(h.id));
    
    // Nutze hier deine bewährte getRandomArrayElements Funktion:
    // (Ich simuliere sie hier kurz mit sort/slice)
    const newChoices = availablePool
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
      
    setOffers(newChoices);
  };

  // Beim ersten Laden der Komponente einmalig Angebote generieren
  useEffect(() => {
    generateNewOffers();
  }, []); // Leeres Array = nur beim "Mount" ausführen

  const handleRefreshClick = () => {
    const success = onRefresh(); // Ruft die Gold-Logik in App.tsx auf
    if (success) {
      generateNewOffers();
    }
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h2>🛒 Hero-Shop</h2>
        <button className="refresh-btn" onClick={handleRefreshClick}>
          🔄 Refresh (5G)
        </button>
      </div>
      <div className="shop-list">
        {offers.map(hero => (
          <div key={hero.id} className="hero-card shop-item">
            <img className="hero-img" src={hero.image} alt={hero.name} />
            <h4>{hero.name}</h4>
            <p>Type: {hero.type}</p>
            <p>Power: {hero.power}</p>
            <button 
              disabled={currentGold < hero.power}
              onClick={() => {
                onBuyHero(hero);
                // Entferne den Helden aus den Angeboten, sobald er gekauft wurde
                setOffers(prev => prev.filter(h => h.id !== hero.id));
              }}
            >
              {hero.power} Gold - Rekrutieren
            </button>
          </div>
        ))}
        {offers.length === 0 && <p>Keine Söldner mehr verfügbar.</p>}
      </div>
    </div>
  );
}