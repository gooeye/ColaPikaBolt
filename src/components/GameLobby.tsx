import React, { useState } from 'react';
import { Users, Copy } from 'lucide-react';

interface GameLobbyProps {
  gameId: string | null;
  players: any[];
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
  onStartGame: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  gameId,
  players,
  onCreateGame,
  onJoinGame,
  onStartGame,
}) => {
  const [joinGameId, setJoinGameId] = useState('');

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId);
    }
  };

  const isHost = gameId && players.find(p => p.isHost)?.id === players[0]?.id;
  const canStartGame = players.length === 3 && isHost;

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-8">
        {!gameId ? (
          <div className="space-y-6">
            <button
              onClick={onCreateGame}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create New Game
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                placeholder="Enter Game ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => onJoinGame(joinGameId)}
                className="w-full bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Join Game
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Game ID: {gameId}</div>
              <button
                onClick={copyGameId}
                className="text-gray-500 hover:text-gray-700"
                title="Copy Game ID"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="h-5 w-5" />
                <span>Players ({players.length}/3)</span>
              </div>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>Player {index + 1} {player.isHost && '(Host)'}</span>
                  </div>
                ))}
                {[...Array(3 - players.length)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded text-gray-400"
                  >
                    <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                    <span>Waiting for player...</span>
                  </div>
                ))}
              </div>
            </div>

            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!canStartGame}
                className={`w-full py-3 px-6 rounded-lg text-white transition-colors ${
                  canStartGame
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Start Game
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameLobby;