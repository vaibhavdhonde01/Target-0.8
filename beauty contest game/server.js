const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
    players: {},
    currentRound: 1,
    roundActive: false,
    gameStarted: false,
    choices: {},
    timer: null,
    timeLeft: 30,
    eliminationCount: 0,
    specialRules: []
};

// Special rules that activate after eliminations
const SPECIAL_RULES = [
    "Double multiplier: Target = Average × 1.6 (instead of 0.8)",
    "Reverse mode: Furthest from target wins",
    "Lucky number: If you choose 42, you automatically win",
    "High stakes: Winner gains +1 point, losers lose -2 points",
    "Prediction mode: Target = Previous round's winner choice × 0.8"
];

// Helper functions
function generatePlayerId() {
    return Math.random().toString(36).substr(2, 9);
}

function calculateTarget(choices, round, eliminationCount) {
    const numbers = Object.values(choices).map(c => c.number);
    const average = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    
    // Apply special rules based on eliminations
    if (eliminationCount >= 1 && eliminationCount <= SPECIAL_RULES.length) {
        const ruleIndex = eliminationCount - 1;
        const rule = SPECIAL_RULES[ruleIndex];
        
        if (rule.includes("Double multiplier")) {
            return average * 1.6;
        }
        // For other rules, still use standard calculation but they affect winner determination
    }
    
    return average * 0.8;
}

function findWinner(choices, target, eliminationCount) {
    const choiceArray = Object.values(choices);
    
    // Apply special rule: Reverse mode
    if (eliminationCount >= 2 && SPECIAL_RULES[1].includes("Reverse mode")) {
        let maxDistance = -1;
        let winner = null;
        
        choiceArray.forEach(choice => {
            const distance = Math.abs(choice.number - target);
            if (distance > maxDistance) {
                maxDistance = distance;
                winner = choice;
            }
        });
        
        return winner;
    }
    
    // Apply special rule: Lucky number 42
    if (eliminationCount >= 3) {
        const luckyChoice = choiceArray.find(choice => choice.number === 42);
        if (luckyChoice) {
            return luckyChoice;
        }
    }
    
    // Standard rule: closest to target
    let minDistance = Infinity;
    let winner = null;
    
    choiceArray.forEach(choice => {
        const distance = Math.abs(choice.number - target);
        if (distance < minDistance) {
            minDistance = distance;
            winner = choice;
        }
    });
    
    return winner;
}

function updateScores(players, winner, eliminationCount) {
    // Apply special rule: High stakes
    const highStakes = eliminationCount >= 4 && SPECIAL_RULES[3].includes("High stakes");
    
    Object.keys(players).forEach(playerId => {
        if (players[playerId].eliminated) return;
        
        if (playerId === winner.playerId) {
            if (highStakes) {
                players[playerId].score += 1;
            }
            // Winner doesn't lose points in standard rules
        } else {
            if (highStakes) {
                players[playerId].score -= 2;
            } else {
                players[playerId].score -= 1;
            }
        }
        
        // Check for elimination
        if (players[playerId].score <= -10) {
            players[playerId].eliminated = true;
            gameState.eliminationCount++;
        }
    });
}

function getActivePlayers() {
    return Object.values(gameState.players).filter(p => !p.eliminated);
}

function startRoundTimer() {
    gameState.timeLeft = 30;
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        io.emit('timerUpdate', { timeLeft: gameState.timeLeft });
        
        if (gameState.timeLeft <= 0) {
            // Auto-submit random choices for players who haven't chosen
            const activePlayers = getActivePlayers();
            activePlayers.forEach(player => {
                if (!gameState.choices[player.id]) {
                    const randomChoice = Math.floor(Math.random() * 101);
                    gameState.choices[player.id] = {
                        playerId: player.id,
                        playerName: player.name,
                        number: randomChoice
                    };
                }
            });
            
            endRound();
        }
    }, 1000);
}

function endRound() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    gameState.roundActive = false;
    
    const choices = gameState.choices;
    const numbers = Object.values(choices).map(c => c.number);
    const average = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const target = calculateTarget(choices, gameState.currentRound, gameState.eliminationCount);
    const winner = findWinner(choices, target, gameState.eliminationCount);
    
    // Update scores
    updateScores(gameState.players, winner, gameState.eliminationCount);
    
    // Check for eliminations
    const eliminatedPlayers = Object.values(gameState.players).filter(p => 
        p.score <= -10 && !p.eliminated
    );
    
    eliminatedPlayers.forEach(player => {
        player.eliminated = true;
        io.emit('playerEliminated', { 
            playerId: player.id, 
            playerName: player.name 
        });
    });
    
    // Emit new rule if someone was eliminated
    if (eliminatedPlayers.length > 0) {
        const ruleIndex = gameState.eliminationCount - eliminatedPlayers.length;
        if (ruleIndex >= 0 && ruleIndex < SPECIAL_RULES.length) {
            const newRule = SPECIAL_RULES[ruleIndex];
            gameState.specialRules.push(newRule);
            io.emit('newRule', { rule: newRule });
        }
    }
    
    // Send round results
    io.emit('roundEnded', {
        round: gameState.currentRound,
        choices,
        average,
        target,
        winner,
        players: gameState.players
    });
    
    // Check if game should end
    const activePlayers = getActivePlayers();
    if (activePlayers.length <= 1) {
        setTimeout(() => {
            io.emit('gameEnded', { 
                winner: activePlayers[0] || null,
                players: gameState.players
            });
            resetGame();
        }, 3000);
        return;
    }
    
    // Start next round after delay
    setTimeout(() => {
        startNextRound();
    }, 5000);
}

function startNextRound() {
    gameState.currentRound++;
    gameState.roundActive = true;
    gameState.choices = {};
    
    const newRuleText = gameState.specialRules.length > 0 ? 
        gameState.specialRules[gameState.specialRules.length - 1] : 
        "Standard rules apply";
    
    io.emit('roundStarted', {
        round: gameState.currentRound,
        players: gameState.players,
        newRule: newRuleText
    });
    
    startRoundTimer();
}

function resetGame() {
    gameState = {
        players: {},
        currentRound: 1,
        roundActive: false,
        gameStarted: false,
        choices: {},
        timer: null,
        timeLeft: 30,
        eliminationCount: 0,
        specialRules: []
    };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('joinGame', (data) => {
        // Check if game already started or full
        if (gameState.gameStarted) {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }
        
        if (Object.keys(gameState.players).length >= 4) {
            socket.emit('error', { message: 'Game is full (4 players maximum)' });
            return;
        }
        
        // Check if name is already taken
        const nameExists = Object.values(gameState.players).some(p => 
            p.name.toLowerCase() === data.name.toLowerCase()
        );
        
        if (nameExists) {
            socket.emit('error', { message: 'Name already taken' });
            return;
        }
        
        // Add player
        const playerId = generatePlayerId();
        gameState.players[playerId] = {
            id: playerId,
            socketId: socket.id,
            name: data.name,
            score: 0,
            eliminated: false
        };
        
        socket.playerId = playerId;
        
        // Notify all players
        io.emit('playerJoined', {
            players: gameState.players,
            playerId: playerId
        });
        
        console.log(`Player ${data.name} joined. Total players: ${Object.keys(gameState.players).length}`);
    });
    
    socket.on('startGame', () => {
        if (!socket.playerId || !gameState.players[socket.playerId]) {
            return;
        }
        
        if (Object.keys(gameState.players).length !== 4) {
            socket.emit('error', { message: 'Need exactly 4 players to start' });
            return;
        }
        
        if (gameState.gameStarted) {
            return;
        }
        
        gameState.gameStarted = true;
        gameState.roundActive = true;
        
        io.emit('gameStarted', {
            players: gameState.players,
            round: gameState.currentRound
        });
        
        // Start first round after a short delay
        setTimeout(() => {
            io.emit('roundStarted', {
                round: gameState.currentRound,
                players: gameState.players,
                newRule: "Standard rules apply"
            });
            startRoundTimer();
        }, 2000);
        
        console.log('Game started with players:', Object.values(gameState.players).map(p => p.name));
    });
    
    socket.on('submitChoice', (data) => {
        if (!socket.playerId || !gameState.players[socket.playerId]) {
            return;
        }
        
        if (!gameState.roundActive || gameState.players[socket.playerId].eliminated) {
            return;
        }
        
        if (gameState.choices[socket.playerId]) {
            return; // Already submitted
        }
        
        const number = parseInt(data.number);
        if (isNaN(number) || number < 0 || number > 100) {
            socket.emit('error', { message: 'Invalid number. Choose between 0 and 100.' });
            return;
        }
        
        gameState.choices[socket.playerId] = {
            playerId: socket.playerId,
            playerName: gameState.players[socket.playerId].name,
            number: number
        };
        
        console.log(`${gameState.players[socket.playerId].name} chose ${number}`);
        
        // Check if all active players have submitted
        const activePlayers = getActivePlayers();
        const submittedCount = activePlayers.filter(p => gameState.choices[p.id]).length;
        
        if (submittedCount === activePlayers.length) {
            endRound();
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        if (socket.playerId && gameState.players[socket.playerId]) {
            const playerName = gameState.players[socket.playerId].name;
            delete gameState.players[socket.playerId];
            
            // If game hasn't started, notify remaining players
            if (!gameState.gameStarted) {
                io.emit('playerJoined', {
                    players: gameState.players
                });
            } else {
                // If game is in progress, mark player as eliminated
                // This prevents the game from hanging
                console.log(`Player ${playerName} disconnected during game`);
            }
            
            // Reset game if no players left
            if (Object.keys(gameState.players).length === 0) {
                resetGame();
                console.log('Game reset - no players remaining');
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Beauty Contest Game Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});