import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Users, Play, PaintBucket } from 'lucide-react';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001');

const App: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');
  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.on('gameCreated', ({ gameId }) => {
      setGameId(gameId);
    });

    socket.on('playersUpdate', ({ players }) => {
      setPlayers(players);
    });

    socket.on('gameStarted', ({ color }) => {
      setGameState('playing');
      setCurrentColor(color);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('playerLeft', () => {
      setGameState('lobby');
      setGameId(null);
      setPlayers([]);
      setCurrentColor(null);
    });

    socket.on('connect_error', () => {
      setError('Unable to connect to game server');
    });

    return () => {
      socket.off('gameCreated');
      socket.off('playersUpdate');
      socket.off('gameStarted');
      socket.off('error');
      socket.off('playerLeft');
      socket.off('connect_error');
    };
  }, []);

  const createGame = () => {
    socket.emit('createGame');
  };

  const joinGame = (gameId: string) => {
    socket.emit('joinGame', { gameId });
  };

  const startGame = () => {
    if (gameId) {
      socket.emit('startGame', { gameId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <PaintBucket className="h-10 w-10" />
            Color Description Game
          </h1>
          <p className="text-white/80">Describe colors, guess others, and score points!</p>
        </header>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {gameState === 'lobby' ? (
          <GameLobby
            gameId={gameId}
            players={players}
            onCreateGame={createGame}
            onJoinGame={joinGame}
            onStartGame={startGame}
          />
        ) : (
          <GameRoom
            socket={socket}
            gameId={gameId!}
            currentColor={currentColor!}
            players={players}
          />
        )}
      </div>
    </div>
  );
}

export default App;