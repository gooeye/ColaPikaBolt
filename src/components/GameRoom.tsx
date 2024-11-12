import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Timer, Send } from 'lucide-react';

interface GameRoomProps {
  socket: Socket;
  gameId: string;
  currentColor: string;
  players: any[];
}

const GameRoom: React.FC<GameRoomProps> = ({
  socket,
  gameId,
  currentColor,
  players,
}) => {
  const [description, setDescription] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState<'describe' | 'guess'>('describe');
  const [descriptions, setDescriptions] = useState<{[key: string]: string}>({});
  const [guessColor, setGuessColor] = useState('#000000');
  const [scores, setScores] = useState<{id: string, score: number}[]>([]);
  const [round, setRound] = useState(1);
  const [gameEnded, setGameEnded] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    socket.on('descriptionPhaseEnd', ({ descriptions, colors }) => {
      setPhase('guess');
      setDescriptions(descriptions);
    });

    socket.on('roundEnd', ({ scores, guesses, correctColors }) => {
      setScores(scores);
      // Show results for 3 seconds before next round
    });

    socket.on('newRound', ({ round, color }) => {
      setRound(round);
      setPhase('describe');
      setTimeLeft(30);
      setDescription('');
      setGuessColor('#000000');
    });

    socket.on('gameEnd', ({ winners }) => {
      setGameEnded(true);
      setWinners(winners);
    });

    return () => {
      clearInterval(timer);
      socket.off('descriptionPhaseEnd');
      socket.off('roundEnd');
      socket.off('newRound');
      socket.off('gameEnd');
    };
  }, [socket]);

  const submitDescription = () => {
    socket.emit('submitDescription', { gameId, description });
  };

  const submitGuess = (playerId: string) => {
    socket.emit('submitGuess', { gameId, playerId, guessedColor: guessColor });
  };

  if (gameEnded) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
        <div className="space-y-4">
          <h3 className="text-xl">Winners:</h3>
          {winners.map((winner, index) => (
            <div key={index} className="font-semibold text-indigo-600">
              Player {players.findIndex(p => p.id === winner.id) + 1} - {winner.score} points
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-bold">Round {round}/3</div>
          <div className="flex items-center gap-2 text-lg">
            <Timer className="h-5 w-5" />
            <span className={timeLeft <= 10 ? 'text-red-500' : ''}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {phase === 'describe' ? (
          <div className="space-y-6">
            <div className="aspect-square w-32 mx-auto rounded-lg shadow-inner"
                 style={{ backgroundColor: currentColor }}></div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Describe this color (without using color names):
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                disabled={timeLeft === 0}
              />
              <button
                onClick={submitDescription}
                disabled={!description || timeLeft === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
                Submit Description
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(descriptions).map(([playerId, desc], index) => (
                <div key={playerId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-2">
                    Player {players.findIndex(p => p.id === playerId) + 1}'s description:
                  </div>
                  <p className="text-gray-700">{desc}</p>
                  <div className="mt-4 space-y-3">
                    <input
                      type="color"
                      value={guessColor}
                      onChange={(e) => setGuessColor(e.target.value)}
                      className="w-full h-12 rounded-lg"
                    />
                    <button
                      onClick={() => submitGuess(playerId)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Submit Guess
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <div className="text-lg font-semibold mb-3">Scores:</div>
          <div className="grid grid-cols-3 gap-4">
            {players.map((player, index) => (
              <div key={player.id} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">Player {index + 1}</div>
                <div className="text-2xl text-indigo-600">
                  {scores.find(s => s.id === player.id)?.score || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;