import React, { useState, useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { 
  Container, 
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@/components/ui';
import { Users } from 'lucide-react';

// Constants
const SOCKET_URL = 'ws://174.23.129.232:8001';
const FRAME_RATE = 60;
const MS_PER_FRAME = 1000 / FRAME_RATE;
const BASE_ROTATION_SPEED = 180; // degrees per second
const MIN_HIT_ZONE_SIZE = 5;
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

const SkillCheckGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyList, setLobbyList] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<LobbyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  
  // Socket setup
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

  // Game loop
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
      // Update rotation
      const newRotation = (prev.rotation + (deltaTime * prev.rotationSpeed)) % 360;
      
      // Update particles
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
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw hit zone
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
    
    // Draw rotating line
    const lineAngle = (gameState.rotation - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(lineAngle) * radius,
      centerY + Math.sin(lineAngle) * radius
    );
    ctx.strokeStyle = 'currentColor';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw particles
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
    } else {
      // Handle wrap-around case
      return rotation >= zoneStart || rotation <= zoneEnd;
    }
  };

  const isPerfectHit = (angles: ReturnType<typeof calculateHitAngle>) => {
    const { rotation, zoneStart, zoneEnd } = angles;
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

      // Haptic feedback
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
      <Container className="max-w-sm">
        <Card className="mt-4 p-4">
          <Typography variant="h5" className="text-red-500 mb-2">
            Connection Error
          </Typography>
          <Typography className="text-gray-600">
            {error}
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl">
      <Box className="mt-4 flex flex-col items-center gap-4">
        {/* Progress Bar */}
        <Box className="w-full h-5 bg-gray-200 rounded-lg overflow-hidden">
          <Box
            className="h-full transition-all duration-300 rounded-lg"
            style={{
              width: `${getScorePercentage()}%`,
              backgroundColor: gameState.player1Score > gameState.player2Score ? '#3f51b5' : '#f50057',
              marginLeft: gameState.player1Score > gameState.player2Score ? 0 : 'auto'
            }}
          />
        </Box>

        {/* Game Title and Instructions */}
        {!currentLobby && (
          <Box className="text-center">
            <Typography variant="h3" className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Skill Check Challenge
            </Typography>
            <Typography className="mt-2 text-gray-600">
              Click when the rotating line aligns with the highlighted zone to score points!
              First player to get {POINTS_TO_WIN} points ahead wins.
            </Typography>
          </Box>
        )}

        {/* Lobby List */}
        {!currentLobby && (
          <Card className="w-full">
            <CardContent>
              <Box className="flex justify-between items-center mb-2">
                <Typography variant="h6">Available Lobbies</Typography>
                <Button
                  variant="default"
                  onClick={() => socket?.emit('createLobby')}
                >
                  Create Lobby
                </Button>
              </Box>
              <List>
                {lobbyList.map(lobby => (
                  <ListItem key={lobby.id} className="border-b last:border-b-0">
                    <ListItemText>
                      <Box className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>{lobby.players}/2 Players</span>
                      </Box>
                    </ListItemText>
                    <ListItemSecondaryAction>
                      <Button
                        variant="secondary"
                        disabled={lobby.players === 2}
                        onClick={() => socket?.emit('joinLobby', lobby.id)}
                      >
                        Join
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {lobbyList.length === 0 && (
                  <Typography className="text-center py-4 text-gray-500">
                    No active lobbies. Create one to start playing!
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Game Area */}
        {currentLobby && (
          <Box className="relative w-full max-w-2xl aspect-square">
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
              <Typography
                className="absolute top-4 right-4 font-bold text-2xl animate-bounce"
                style={{ color: gameState.combo >= 5 ? '#ffd700' : '#4caf50' }}
              >
                {gameState.combo}x Combo!
              </Typography>
            )}
            
            {/* Perfect Hit Indicator */}
            <Box
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ opacity: gameState.particleEffects.length > 0 ? 1 : 0 }}
            >
              <Typography
                className="text-4xl font-bold text-yellow-500 animate-ping"
                style={{ display: gameState.particleEffects.some(p => p.color === '#ffd700') ? 'block' : 'none' }}
              >
                PERFECT!
              </Typography>
            </Box>
          </Box>
        )}

        {/* Game Status */}
        <Box className="text-center">
          {currentLobby && (
            <>
              <Typography variant="h5" className="mb-2">
                {getWinningPlayer() 
                  ? `Player ${getWinningPlayer()} Wins!` 
                  : `Player 1: ${gameState.player1Score} - Player 2: ${gameState.player2Score}`
                }
              </Typography>
              
              {!gameState.gameActive && (
                <Typography className="text-blue-500 animate-pulse">
                  Waiting for opponent...
                </Typography>
              )}

              {gameState.gameActive && (
                <Typography className="text-sm text-gray-600">
                  {gameState.isPlayer1 ? "You are Player 1" : "You are Player 2"}
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Game Stats (visible during gameplay) */}
        {currentLobby && gameState.gameActive && (
          <Card className="w-full mt-4">
            <CardContent>
              <Box className="grid grid-cols-3 gap-4 text-center">
                <Box>
                  <Typography className="text-gray-600">Speed</Typography>
                  <Typography className="text-lg font-bold">
                    {Math.round(gameState.rotationSpeed / BASE_ROTATION_SPEED * 100)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography className="text-gray-600">Hit Zone</Typography>
                  <Typography className="text-lg font-bold">
                    {Math.round(gameState.hitZoneSize)}°
                  </Typography>
                </Box>
                <Box>
                  <Typography className="text-gray-600">Best Combo</Typography>
                  <Typography className="text-lg font-bold">
                    {gameState.combo}x
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );