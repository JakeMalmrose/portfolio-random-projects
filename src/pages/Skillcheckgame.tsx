import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';
import { Socket, io } from 'socket.io-client';

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
}

interface Lobby {
  id: string;
  players: number;
}

interface LobbyData {
  id: string;
  player1Id: string;
}

const SOCKET_URL = 'ws://174.23.129.232:8001';
const INITIAL_ROTATION_SPEED = 2;
const INITIAL_HIT_ZONE_SIZE = 30;
const POINTS_TO_WIN = 1000;

const SkillCheckGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    rotation: 0,
    hitZonePosition: 0,
    hitZoneSize: INITIAL_HIT_ZONE_SIZE,
    player1Score: 0,
    player2Score: 0,
    rotationSpeed: INITIAL_ROTATION_SPEED,
    gameActive: false,
    playerId: null,
    isPlayer1: false,
  });
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobbyList, setLobbyList] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<LobbyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

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
        hitZonePosition: initialState.hitZonePosition
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

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      
      if (gameState.gameActive) {
        setGameState(prev => ({
          ...prev,
          rotation: (prev.rotation + (deltaTime * (1 / (prev.rotationSpeed * 1000)))) % 1
        }));
      }
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState.gameActive]);

  const handleClick = () => {
    if (!gameState.gameActive || !socket || !currentLobby) return;

    const currentAngle = gameState.rotation * 360;
    const hitZoneStart = gameState.hitZonePosition;
    const hitZoneEnd = (hitZoneStart + gameState.hitZoneSize) % 360;
    
    const isHit = 
      (currentAngle >= hitZoneStart && currentAngle <= hitZoneEnd) ||
      (hitZoneEnd < hitZoneStart && (currentAngle >= hitZoneStart || currentAngle <= hitZoneEnd));

    if (isHit) {
      socket.emit('skillCheckHit', {
        lobbyId: currentLobby.id,
        playerId: gameState.playerId
      });
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
      <Container maxWidth="sm">
        <Card sx={{ mt: 4, p: 2 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Connection Error
          </Typography>
          <Typography color="text.secondary">
            {error}
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* Progress Bar */}
        <Box sx={{ width: '100%', height: 20, bgcolor: 'grey.200', borderRadius: 1 }}>
          <Box
            sx={{
              height: '100%',
              width: `${getScorePercentage()}%`,
              bgcolor: gameState.player1Score > gameState.player2Score ? 'primary.main' : 'secondary.main',
              transition: 'all 0.3s ease',
              borderRadius: 1,
              ml: gameState.player1Score > gameState.player2Score ? 0 : 'auto'
            }}
          />
        </Box>

        {/* Game Title and Instructions */}
        {!currentLobby && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" 
              sx={{
                background: 'linear-gradient(45deg, #bb86fc 30%, #cf6679 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Skill Check Challenge
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Click when the rotating line aligns with the highlighted zone to score points!
              First player to get 1000 points ahead wins.
            </Typography>
          </Box>
        )}

        {/* Lobby List */}
        {!currentLobby && (
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Available Lobbies</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => socket?.emit('createLobby')}
                >
                  Create Lobby
                </Button>
              </Box>
              <List>
                {lobbyList.map(lobby => (
                  <ListItem key={lobby.id} divider>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GroupIcon />
                          <span>{lobby.players}/2 Players</span>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={lobby.players === 2}
                        onClick={() => socket?.emit('joinLobby', lobby.id)}
                      >
                        Join
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {lobbyList.length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No active lobbies. Create one to start playing!
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Game Area */}
        {currentLobby && (
          <Box
            onClick={handleClick}
            sx={{
              position: 'relative',
              width: 384,
              height: 384,
              cursor: 'pointer'
            }}
          >
            {/* Circle and hit zone container */}
            <svg
              viewBox="0 0 100 100"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%'
              }}
            >
              {/* Main circle */}
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="2"
              />
              
              {/* Hit zone arc */}
              {gameState.gameActive && (
                <path
                  d={`
                    M 50 50
                    L ${50 + 48 * Math.cos((gameState.hitZonePosition - 90) * Math.PI / 180)} ${50 + 48 * Math.sin((gameState.hitZonePosition - 90) * Math.PI / 180)}
                    A 48 48 0 0 1 ${50 + 48 * Math.cos((gameState.hitZonePosition + gameState.hitZoneSize - 90) * Math.PI / 180)} ${50 + 48 * Math.sin((gameState.hitZonePosition + gameState.hitZoneSize - 90) * Math.PI / 180)}
                    L 50 50
                  `}
                  fill="rgba(76, 175, 80, 0.3)"
                />
              )}
              
              {/* Rotating line */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="2"
                stroke="currentColor"
                strokeWidth="2"
                transform={`rotate(${gameState.rotation * 360}, 50, 50)`}
              />
            </svg>
          </Box>
        )}

        {/* Game Status */}
        <Box sx={{ textAlign: 'center' }}>
          {currentLobby && (
            <Typography variant="h5" color="text.primary">
              {getWinningPlayer() 
                ? `Player ${getWinningPlayer()} Wins!` 
                : `Player 1: ${gameState.player1Score} - Player 2: ${gameState.player2Score}`
              }
            </Typography>
          )}
          {currentLobby && !gameState.gameActive && (
            <Typography color="primary" sx={{ mt: 2 }}>
              Waiting for opponent...
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default SkillCheckGame;