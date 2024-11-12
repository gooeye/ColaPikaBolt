import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://color-description-game.netlify.app'  // Update this with your Netlify URL
      : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const games = new Map();
const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#33FFF5', '#F5FF33'];

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createGame', () => {
    const gameId = Math.random().toString(36).substring(7);
    games.set(gameId, {
      players: [{id: socket.id, isHost: true, score: 0}],
      status: 'waiting',
      round: 0,
      colors: {},
      descriptions: {},
      guesses: {}
    });
    socket.join(gameId);
    socket.emit('gameCreated', { gameId });
    io.to(gameId).emit('playersUpdate', { players: games.get(gameId).players });
  });

  socket.on('joinGame', ({ gameId }) => {
    const game = games.get(gameId);
    if (!game || game.players.length >= 3 || game.status !== 'waiting') {
      socket.emit('error', { message: 'Cannot join game' });
      return;
    }
    
    game.players.push({id: socket.id, isHost: false, score: 0});
    socket.join(gameId);
    io.to(gameId).emit('playersUpdate', { players: game.players });
  });

  socket.on('startGame', ({ gameId }) => {
    const game = games.get(gameId);
    if (!game || game.players.length !== 3) return;

    game.status = 'playing';
    game.round = 1;
    
    game.players.forEach((player) => {
      game.colors[player.id] = colors[Math.floor(Math.random() * colors.length)];
    });

    game.players.forEach(player => {
      io.to(player.id).emit('gameStarted', {
        color: game.colors[player.id]
      });
    });

    setTimeout(() => {
      if (game.status === 'playing') {
        io.to(gameId).emit('descriptionPhaseEnd', {
          descriptions: game.descriptions,
          colors: game.colors
        });
      }
    }, 30000);
  });

  socket.on('submitDescription', ({ gameId, description }) => {
    const game = games.get(gameId);
    if (!game) return;
    
    game.descriptions[socket.id] = description;
    
    if (Object.keys(game.descriptions).length === game.players.length) {
      io.to(gameId).emit('descriptionPhaseEnd', {
        descriptions: game.descriptions,
        colors: game.colors
      });
    }
  });

  socket.on('submitGuess', ({ gameId, playerId, guessedColor }) => {
    const game = games.get(gameId);
    if (!game) return;

    game.guesses[socket.id] = { playerId, guessedColor };

    if (Object.keys(game.guesses).length === game.players.length) {
      Object.entries(game.guesses).forEach(([guesserId, guess]) => {
        if (game.colors[guess.playerId].toLowerCase() === guess.guessedColor.toLowerCase()) {
          const guesser = game.players.find(p => p.id === guesserId);
          const describer = game.players.find(p => p.id === guess.playerId);
          if (guesser) guesser.score += 1;
          if (describer) describer.score += 1;
        }
      });

      io.to(gameId).emit('roundEnd', {
        scores: game.players.map(p => ({ id: p.id, score: p.score })),
        guesses: game.guesses,
        correctColors: game.colors
      });

      game.round++;
      game.descriptions = {};
      game.guesses = {};
      
      if (game.round <= 3) {
        game.players.forEach(player => {
          game.colors[player.id] = colors[Math.floor(Math.random() * colors.length)];
        });

        setTimeout(() => {
          game.players.forEach(player => {
            io.to(player.id).emit('newRound', {
              round: game.round,
              color: game.colors[player.id]
            });
          });
        }, 3000);
      } else {
        io.to(gameId).emit('gameEnd', {
          winners: game.players
            .sort((a, b) => b.score - a.score)
            .filter((p, i, arr) => p.score === arr[0].score)
        });
        games.delete(gameId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    games.forEach((game, gameId) => {
      if (game.players.some(p => p.id === socket.id)) {
        io.to(gameId).emit('playerLeft');
        games.delete(gameId);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});