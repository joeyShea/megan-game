interface Props {
  onCreate: () => void;
  onJoin: () => void;
}

export default function HomeScreen({ onCreate, onJoin }: Props) {
  return (
    <div className="screen">
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: '4rem' }}>☕</div>
        <h1>Café Clash</h1>
        <p className="subtitle">A multiplayer coffee-themed brawler</p>
      </div>
      <div className="card" style={{ gap: 16 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onCreate}>
          Create Lobby
        </button>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onJoin}>
          Join Lobby
        </button>
      </div>
      <p className="subtitle" style={{ fontSize: '0.8rem', opacity: 0.5 }}>2–4 players · Free for all</p>
    </div>
  );
}
