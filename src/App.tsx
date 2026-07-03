import { useState, useEffect } from 'react'
import HeroCard from './HeroCard.tsx'
import Graveyard from './Graveyard.tsx'
import ToastContainer from './ToastContainer'
import hero_pool from './HeroPool.tsx'
import MissionButton from './MissionButton.tsx'
import HeroShop from './HeroShop.tsx'
import './App.css'

interface Hero {
  id: number;
  name: string;
  type: string;
  power: number;
  status: string;
  image: string;
}

export interface MissionConfig {
  label: string;
  difficulty: "easy" | "hard" | "legendary";
  duration: number; // in Sekunden
  baseChance: number;
  preferredClass: string[];
  powerGain: number;
  minGold: number;
  maxGold: number;
  maxHeroes: number;
}

const MISSION_TYPES: MissionConfig[] = [
  { label: "Patrouille", difficulty: "easy", duration: 3, baseChance: 0.9, preferredClass: ["Speedster", "Tech"], powerGain: 1, minGold: 1, maxGold: 3, maxHeroes: 1 },
  { label: "Bankraub verhindern", difficulty: "hard", duration: 7, baseChance: 0.5, preferredClass: ["Tank", "Fighter"], powerGain: 4, minGold: 5, maxGold: 10, maxHeroes: 2 },
  { label: "Alien Invasion", difficulty: "legendary", duration: 12, baseChance: 0.2, preferredClass: ["Fighter", "Tank", "Tech"], powerGain: 10, minGold: 15, maxGold: 30, maxHeroes: 4 },
];

const calculateTeamChance = (selectedHeroes: Hero[], mission: MissionConfig): number => {
  let chance = mission.baseChance;

  selectedHeroes.forEach(hero => {
    // Power-Bonus (etwas abgeschwächt, da mehr Helden dabei sind)
    chance += (hero.power / 10) * 0.03;

    // Klassen-Bonus
    if (mission.preferredClass.includes(hero.type)) {
      chance += 0.10; // +10% pro passendem Helden
    }
  });

  return Math.min(Math.max(chance, 0.05), 0.99);
};

function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function getRandomArrayElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function App() {
  const [heroes, setHeroes] = useState(() => getRandomArrayElements(hero_pool, 5));
  const [graveyard, setGraveyard] = useState<Hero[]>([]);
  const [gold, setGold] = useState(300);
  const [selectedHeroIds, setSelectedHeroIds] = useState<number[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroes(prevHeroes =>
        prevHeroes.map(h =>
          h.timer > 0 ? { ...h, timer: h.timer - 1 } : h
        )
      );
    }, 1000);

    return () => clearInterval(interval); // Wichtig: Aufräumen, wenn die App schließt!
  }, []);

  const toggleHeroSelection = (id: number) => {
    // Den Helden in der aktuellen Liste finden
    const hero = heroes.find(h => h.id === id);

    // Nur umschalten, wenn der Held existiert UND verfügbar ist
    // (Oder wenn er bereits ausgewählt ist, damit man ihn wieder ABwählen kann)
    if (hero && (hero.status === "available" || selectedHeroIds.includes(id))) {
      setSelectedHeroIds(prev =>
        prev.includes(id)
          ? prev.filter(heroId => heroId !== id)
          : [...prev, id]
      );
    }
  };

  const startMission = (mission: MissionConfig) => {
    if (selectedHeroIds.length === 0) return;

    const heroesOnMission = heroes.filter(h => selectedHeroIds.includes(h.id));
    const chance = calculateTeamChance(heroesOnMission, mission);
    const teamNames = heroesOnMission.map(h => h.name).join(", ");
    const currentTeamIds = [...selectedHeroIds];

    // Alle Teilnehmer auf 'busy' setzen
    setHeroes(prev => prev.map(h =>
      selectedHeroIds.includes(h.id)
        ? { ...h, status: "busy", timer: mission.duration, maxTimer: mission.duration }
        : h
    ));

    setSelectedHeroIds([]); // Auswahl leeren

    setTimeout(() => {
      const success = Math.random() < chance;

      if (success) {
        const earnedGold = getRandomInt(mission.minGold, mission.maxGold);
        setGold(prev => prev + earnedGold);
        // Erfolg: Alle bekommen Power
        setHeroes(prev => prev.map(h =>
          heroesOnMission.some(mH => mH.id === h.id)
            ? { ...h, status: "available", power: h.power + mission.powerGain, timer: 0 }
            : h
        ));

        setNotifications(prev => [...prev, {
          id: Date.now(),
          text: `Erfolg! Das Team (${teamNames}) war siegreich! 
          +${mission.powerGain} Power für alle Teilnehmenden Helden
          +${earnedGold} Gold verdient`
        }]);

      } else {
        // 1. Wir bestimmen für alle Teilnehmer gleichzeitig, wer stirbt
        const fallenHeroes = heroesOnMission.filter(() => Math.random() < 0.10);
        const fallenIds = fallenHeroes.map(h => h.id);
        setNotifications(prev => [...prev, {
          id: Date.now(),
          text: `Die Mission "${mission.label}" des Teams (${teamNames}) ist fehlgeschlagen! ❌`
        }]);
        if (fallenHeroes.length > 0) {
          // 2. Alle Gefallenen auf einmal in den Friedhof
          setGraveyard(prev => [
            ...prev,
            ...fallenHeroes.map(h => ({ ...h, status: "dead" as const }))
          ]);

          // 3. Neue Benachrichtigungen für jeden Toten
          fallenHeroes.forEach(hero => {
            setNotifications(prev => [...prev, {
              id: Date.now() + Math.random(), // Random addieren, damit IDs bei Massensterben unique sind
              text: `TRAGÖDIE: ${hero.name} ist im Einsatz gefallen! 💀`
            }]);
          });
        }

        // 4. State-Update für ALLE Helden der Mission
        setHeroes(prev => {
          // Wir filtern die Toten raus UND setzen die Überlebenden zurück auf "available"
          return prev
            .filter(h => !fallenIds.includes(h.id)) // Wer tot ist, fliegt raus
            .map(h => {
              // Wer auf der Mission war und NICHT tot ist, wird wieder frei
              if (currentTeamIds.includes(h.id)) {
                return { ...h, status: "available", timer: 0 };
              }
              return h;
            });
        });
      }
    }, (mission.duration + 1) * 1000);
  };

  const buyHero = (hero: Hero) => {
    const cost = hero.power; // Festpreis für jeden Helden
    if (gold >= cost) {
      setGold(prev => prev - cost);
      // Wir fügen den neuen Helden der Liste hinzu
      setHeroes(prev => [...prev, { ...hero, status: "available", timer: 0 }]);

      setNotifications(prev => [...prev, {
        id: Date.now(),
        text: `${hero.name} hat sich deiner Truppe angeschlossen! ⚔️`
      }]);
    } else {
      alert("Nicht genug Gold!");
    }
  };

  const refreshShopCost = 5;

  const handleRefreshGold = () => {
    if (gold >= refreshShopCost) {
      setGold(prev => prev - refreshShopCost);
      return true; // Signalisiert dem Shop: "Zahlung erfolgreich"
    }
    alert("Zu wenig Gold für einen Refresh!");
    return false;
  };

  const [notifications, setNotifications] = useState<{ id: number, text: string }[]>([]);

  return (
    <div className="main">
      <div className="gold-container">{gold} Gold</div>
      <h1>Hero Dispatcher</h1>
      <div className="hero-list">
        {heroes.map((hero) => (
          // Hier rufen wir die Komponente auf und übergeben den aktuellen "hero" als Prop
          <HeroCard
            key={hero.id}
            hero={hero}
            onSelect={() => toggleHeroSelection(hero.id)}
            isSelected={selectedHeroIds.includes(hero.id)}
          />
        ))}
      </div>
      <div className="controls">
        <div className="mission-controls">
          {MISSION_TYPES.map(m => {
            // 1. Hol dir die echten Helden-Objekte für die aktuell ausgewählten IDs
            const selectedHeroObjects = heroes.filter(h => selectedHeroIds.includes(h.id));

            // 2. Berechne die Chance basierend auf dem gesamten Team-Array
            const currentChance = selectedHeroObjects.length > 0
              ? calculateTeamChance(selectedHeroObjects, m)
              : m.baseChance;

            // 3. Prüfen, ob mindestens einer im Team die passende Klasse hat (für das ⭐ Bonus-Icon)
            const hasSynergy = selectedHeroObjects.some(h => m.preferredClass.includes(h.type));

            // 4. Team-Check: Größe okay? Und sind alle ausgewählten Helden "available"?
            const isTeamSizeOk = selectedHeroIds.length >= 1 && selectedHeroIds.length <= m.maxHeroes;
            const allAvailable = selectedHeroObjects.every(h => h.status === "available");

            return (
              <div key={m.label} className="mission-wrapper">
                <MissionButton
                  config={m}
                  onLaunch={() => startMission(m, currentChance)}
                  // Der Button ist nur aktiv, wenn Team-Größe stimmt UND alle bereit sind
                  disabled={!isTeamSizeOk || !allAvailable}
                />

                {selectedHeroIds.length > 0 && (
                  <div className={`chance-display ${hasSynergy ? 'synergy' : ''}`}>
                    Chance: {(currentChance * 100).toFixed(0)}%
                    {hasSynergy && " ⭐ Bonus!"}
                  </div>
                )}

                <div className={`team-size ${selectedHeroIds.length > m.maxHeroes ? 'error' : ''}`}>
                  👥 {selectedHeroIds.length} / {m.maxHeroes} Helden
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="hero-shop"><HeroShop
        onBuyHero={buyHero}
        currentGold={gold}
        onRefresh={handleRefreshGold}
        ownedHeroIds={heroes.map(h => h.id).concat(graveyard.map(h => h.id))}
      /></div>
      <Graveyard deadHeroes={graveyard} ></Graveyard>
      <ToastContainer
        notifications={notifications}
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </div>
  )
}

export default App
