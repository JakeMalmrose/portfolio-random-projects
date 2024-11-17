import React, { useState, useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { Users } from 'lucide-react';

// Constants
const SOCKET_URL = 'ws://174.23.129.232:8001';
const FRAME_RATE = 60;
const MS_PER_FRAME = 1000 / FRAME_RATE;
const BASE_ROTATION_SPEED = 180; // degrees per second
const PERFECT_HIT_THRESHOLD = 3; // degrees
const PERFECT_HIT_BONUS = 50;
const COMBO_MULTIPLIER = 1.2;
const COMBO_TIMEOUT = 1000; // ms
const POINTS_TO_WIN = 1000;

// Types
interface GameState {
  rotation: number;
  hitZonePosition: number;
  hitZoneSize: number;
  player1Score: number;
  player2Score: number;
  rotationSpeed: number;
  gameActive: boolean;
  playerId: string | null;
  isPlayer1: boolean;
  combo: number;
  lastHitTime: number;
  particleEffects: ParticleEffect[];
}

interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  scale: number;
  lifetime: number;
  creation: number;
}

interface Lobby {
  id: string;
  players: number;
}

interface LobbyData {
  id: string;
  player1Id: string;
}

const initialGameState: GameState = {
  rotation: 0,
  hitZonePosition: 0,
  hitZoneSize: 30,
  player1Score: 0,
  player2Score: 0,
  rotationSpeed: BASE_ROTATION_SPEED,
  gameActive: false,
  playerId: null,
  isPlayer1: false,
  combo: 0,
  lastHitTime: 0,
  particleEffects: []
};

class ParticleSystem {
  generateHitParticles(x: number, y: number, perfectHit: boolean): ParticleEffect[] {
    const particles: ParticleEffect[] = [];
    const particleCount = perfectHit ? 20 : 10;
    const baseColor = perfectHit ? '#ffd700' : '#4caf50';
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = perfectHit ? 200 + Math.random() * 100 : 150 + Math.random() * 50;
      
      particles.push({
        id: `particle-${Date.now()}-${i}`,
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color: baseColor,
        scale: perfectHit ? 2 : 1,
        lifetime: perfectHit ? 1000 : 500,
        creation: Date.now()
      });
    }
    
    return particles;
  }
}

const SkillCheckGame = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyList, setLobbyList] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<LobbyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      setError(null);
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (err: Error) => {
      setError('Failed to connect to game server. Please try again later.');
      console.error('Connection error:', err);
    });

    newSocket.on('lobbies', (lobbies: Lobby[]) => {
      setLobbyList(lobbies);
    });

    newSocket.on('joinedLobby', (lobbyData: LobbyData) => {
      setCurrentLobby(lobbyData);
      setGameState(prev => ({
        ...prev,
        playerId: newSocket.id || null,
        isPlayer1: lobbyData.player1Id === newSocket.id
      }));
    });

    newSocket.on('gameStart', (initialState: { hitZonePosition: number }) => {
      setGameState(prev => ({
        ...prev,
        gameActive: true,
        hitZonePosition: initialState.hitZonePosition,
        rotation: 0,
        combo: 0,
        lastHitTime: 0,
        particleEffects: []
      }));
    });

    newSocket.on('gameUpdate', (update: Partial<GameState>) => {
      setGameState(prev => ({
        ...prev,
        ...update
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const gameLoop = (timestamp: number) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    
    const deltaTime = timestamp - lastFrameTimeRef.current;
    
    if (deltaTime >= MS_PER_FRAME) {
      updateGameState(deltaTime / 1000);
      drawGame();
      lastFrameTimeRef.current = timestamp;
    }
    
    requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    requestAnimationFrame(gameLoop);
    return () => {
      lastFrameTimeRef.current = 0;
    };
  }, [gameState.gameActive]);

  const updateGameState = (deltaTime: number) => {
    setGameState(prev => {
      const newRotation = (prev.rotation + (deltaTime * prev.rotationSpeed)) % 360;
      
      const currentTime = Date.now();
      const updatedParticles = prev.particleEffects
        .map(particle => ({
          ...particle,
          x: particle.x + particle.velocityX * deltaTime,
          y: particle.y + particle.velocityY * deltaTime
        }))
        .filter(particle => currentTime - particle.creation < particle.lifetime);
      
      return {
        ...prev,
        rotation: newRotation,
        particleEffects: updatedParticles
      };
    });
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (gameState.gameActive) {
      const startAngle = (gameState.hitZonePosition - 90) * Math.PI / 180;
      const endAngle = (gameState.hitZonePosition + gameState.hitZoneSize - 90) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.fill();
    }
    
    const lineAngle = (gameState.rotation - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(lineAngle) * radius,
      centerY + Math.sin(lineAngle) * radius
    );
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    gameState.particleEffects.forEach(particle => {
      const progress = 1 - ((Date.now() - particle.creation) / particle.lifetime);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.scale * 2 * progress, 0, Math.PI * 2);
      ctx.fillStyle = particle.color + Math.floor(progress * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
  };

  const calculateHitAngle = () => {
    const normalizedRotation = gameState.rotation % 360;
    const normalizedHitZone = gameState.hitZonePosition % 360;
    const hitZoneEnd = (normalizedHitZone + gameState.hitZoneSize) % 360;
    
    return {
      rotation: normalizedRotation,
      zoneStart: normalizedHitZone,
      zoneEnd: hitZoneEnd
    };
  };

  const isValidHit = (angles: ReturnType<typeof calculateHitAngle>) => {
    const { rotation, zoneStart, zoneEnd } = angles;
    
    if (zoneEnd > zoneStart) {
      return rotation >= zoneStart && rotation <= zoneEnd;
    }
    return rotation >= zoneStart || rotation <= zoneEnd;
  };

  const isPerfectHit = (angles: ReturnType<typeof calculateHitAngle>) => {
    const { rotation, zoneStart } = angles;
    const zoneCenter = (zoneStart + (gameState.hitZoneSize / 2)) % 360;
    const distanceToCenter = Math.min(
      Math.abs(rotation - zoneCenter),
      Math.abs(rotation - zoneCenter + 360),
      Math.abs(rotation - zoneCenter - 360)
    );
    
    return distanceToCenter <= PERFECT_HIT_THRESHOLD;
  };

  const handleClick = () => {
    if (!gameState.gameActive || !socket || !currentLobby) return;

    const hitAngles = calculateHitAngle();
    const perfectHit = isPerfectHit(hitAngles);
    const validHit = isValidHit(hitAngles);

    if (validHit) {
      const currentTime = Date.now();
      const timeSinceLastHit = currentTime - gameState.lastHitTime;
      const newCombo = timeSinceLastHit < COMBO_TIMEOUT ? gameState.combo + 1 : 1;
      
      let points = 100;
      if (perfectHit) points += PERFECT_HIT_BONUS;
      points *= Math.pow(COMBO_MULTIPLIER, newCombo - 1);

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const particles = particleSystemRef.current.generateHitParticles(centerX, centerY, perfectHit);
        
        setGameState(prev => ({
          ...prev,
          combo: newCombo,
          lastHitTime: currentTime,
          particleEffects: [...prev.particleEffects, ...particles]
        }));
      }

      socket.emit('skillCheckHit', {
        lobbyId: currentLobby.id,
        playerId: gameState.playerId,
        points,
        perfectHit
      });

      if (navigator.vibrate) {
        navigator.vibrate(perfectHit ? [50, 50, 50] : [40]);
      }
    }
  };

  const getScorePercentage = () => {
    const scoreDiff = gameState.player1Score - gameState.player2Score;
    const percentage = Math.abs(scoreDiff) / POINTS_TO_WIN * 100;
    return Math.min(percentage, 100);
  };

  const getWinningPlayer = () => {
    if (Math.abs(gameState.player1Score - gameState.player2Score) >= POINTS_TO_WIN) {
      return gameState.player1Score > gameState.player2Score ? 1 : 2;
    }
    return null;
  };

  if (error) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h5 className="text-red-500 text-xl mb-2">Connection Error</h5>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mt-4 flex flex-col items-center gap-4">
        {/* Progress Bar */}
        <div className="w-full h-5 bg-gray-200 rounded-lg overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-lg"
            style={{
              width: `${getScorePercentage()}%`,
              backgroundColor: gameState.player1Score > gameState.player2Score ? '#3f51b5' : '#f50057',
              marginLeft: gameState.player1Score > gameState.player2Score ? 0 : 'auto'
            }}
          />
        </div>

        {/* Game Title and Instructions */}
        {!currentLobby && (
          <div className="text-center">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Skill Check Challenge
            </h3>
            <p className="mt-2 text-gray-600">
              Click when the rotating line aligns with the highlighted zone to score points!
              First player to get {POINTS_TO_WIN} points ahead wins.
            </p>
          </div>
        )}

        {/* Lobby List */}
        {!currentLobby && (
          <div className="w-full bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h6 className="text-xl font-semibold">Available Lobbies</h6>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => socket?.emit('createLobby')}
              >
                Create Lobby
              </button>
            </div>
            <div className="divide-y">
              {lobbyList.map(lobby => (
                <div key={lobby.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{lobby.players}/2 Players</span>
                  </div>
                  <button
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={lobby.players === 2}
                    onClick={() => socket?.emit('joinLobby', lobby.id)}
                  >
                    Join
                  </button>
                </div>
              ))}
              {lobbyList.length === 0 && (
                <p className="text-center py-4 text-gray-500">
                  No active lobbies. Create one to start playing!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Game Area */}
        {currentLobby && (
          <div className="relative w-full max-w-2xl aspect-square">
            <canvas
              ref={canvasRef}
              width={800}
              height={800}
              className="w-full h-full cursor-pointer touch-none"
              onClick={handleClick}
              onTouchStart={(e) => {
                e.preventDefault();
                handleClick();
              }}
            />
            
            {/* Combo Counter */}
            {gameState.combo > 1 && (
              <p
                className="absolute top-4 right-4 font-bold text-2xl animate-bounce"
                style={{ color: gameState.combo >= 5 ? '#ffd700' : '#4caf50' }}
              >
                {gameState.combo}x Combo!
              </p>
            )}
            
            {/* Perfect Hit Indicator */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ opacity: gameState.particleEffects.length > 0 ? 1 : 0 }}
            >
              <p
                className="text-4xl font-bold text-yellow-500 animate-ping"
                style={{ display: gameState.particleEffects.some(p => p.color === '#ffd700') ? 'block' : 'none' }}
              >
                PERFECT!
              </p>
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="text-center">
          {currentLobby && (
            <>
              <h5 className="text-xl font-bold mb-2">
                {getWinningPlayer() 
                  ? `Player ${getWinningPlayer()} Wins!` 
                  : `Player 1: ${gameState.player1Score} - Player 2: ${gameState.player2Score}`
                }
              </h5>
              
              {!gameState.gameActive && (
                <p className="text-blue-500 animate-pulse">
                  Waiting for opponent...
                </p>
              )}

              {gameState.gameActive && (
                <p className="text-sm text-gray-600">
                  {gameState.isPlayer1 ? "You are Player 1" : "You are Player 2"}
                </p>
              )}
            </>
          )}
        </div>

        {/* Game Stats */}
        {currentLobby && gameState.gameActive && (
          <div className="w-full mt-4 bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-600">Speed</p>
                <p className="text-lg font-bold">
                  {Math.round(gameState.rotationSpeed / BASE_ROTATION_SPEED * 100)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">Hit Zone</p>
                <p className="text-lg font-bold">
                  {Math.round(gameState.hitZoneSize)}°
                </p>
              </div>
              <div>
                <p className="text-gray-600">Best Combo</p>
                <p className="text-lg font-bold">
                  {gameState.combo}x
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillCheckGame;