import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type PollStatus = 'ACTIVE' | 'RESOLVED_A' | 'RESOLVED_B' | null;
type BetChoice = 'A' | 'B';

interface Poll {
  id: string;
  title: string;
  optionA: string;
  optionB: string;
  creatorId: string;
  status: PollStatus;
  totalPointsA: number;
  totalPointsB: number;
  owner: string | null;
}

interface Bet {
  id: string;
  userId: string;
  pollId: string;
  amount: number;
  choice: "A" | "B" | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Gambling() {
  const { user } = useAuthenticator();
  const [userPoints, setUserPoints] = useState<number>(500);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: '',
    optionA: '',
    optionB: '',
  });
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [betChoice, setBetChoice] = useState<BetChoice | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (user) {
      loadUserPoints();
      loadPolls();
    }
  }, [user]);

  const loadUserPoints = async () => {
    try {
      const userPointsRecord = await client.models.UserPoints.list({
        filter: { userId: { eq: user.username } }
      });
      
      if (userPointsRecord.data.length === 0) {
        // Initialize new user with 500 points
        await client.models.UserPoints.create({
          userId: user.username,
          points: 500,
        });
        setUserPoints(500);
      } else {
        setUserPoints(userPointsRecord.data[0].points);
      }
    } catch (error) {
      showSnackbar('Error loading points', 'error');
    }
  };

  const loadPolls = async () => {
    try {
      const pollsData = await client.models.Poll.list();
      setPolls(pollsData.data);
      
      // Load all bets
      const betsData = await client.models.Bet.list();
      setBets(betsData.data.filter(bet => 
        bet !== null && 
        typeof bet.choice === 'string' && 
        (bet.choice === 'A' || bet.choice === 'B')
      ) as Bet[]);
      
      setLoading(false);
    } catch (error) {
      showSnackbar('Error loading polls', 'error');
      setLoading(false);
    }
  };

  const calculatePollTotals = (pollId: string) => {
    const pollBets = bets.filter(bet => bet.pollId === pollId);
    const totalA = pollBets
      .filter(bet => bet.choice === 'A')
      .reduce((sum, bet) => sum + bet.amount, 0);
    const totalB = pollBets
      .filter(bet => bet.choice === 'B')
      .reduce((sum, bet) => sum + bet.amount, 0);
    return { totalA, totalB };
  };

  const handleCreatePoll = async () => {
    try {
      await client.models.Poll.create({
        title: newPoll.title,
        optionA: newPoll.optionA,
        optionB: newPoll.optionB,
        creatorId: user.username,
        status: 'ACTIVE',
        totalPointsA: 0,
        totalPointsB: 0,
      });
      setCreateDialogOpen(false);
      setNewPoll({ title: '', optionA: '', optionB: '' });
      loadPolls();
      showSnackbar('Poll created successfully', 'success');
    } catch (error) {
      showSnackbar('Error creating poll', 'error');
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedPoll || !betChoice || !betAmount) return;

    const amount = parseInt(betAmount);
    if (amount > userPoints) {
      showSnackbar('Not enough points', 'error');
      return;
    }

    try {
      // Create bet
      const newBetResponse = await client.models.Bet.create({
        userId: user.username,
        pollId: selectedPoll.id,
        amount,
        choice: betChoice,
      });

      if (newBetResponse.data) {
        // Update user points
        const userPointsRecord = await client.models.UserPoints.list({
          filter: { userId: { eq: user.username } }
        });
        
        if (userPointsRecord.data.length > 0) {
          await client.models.UserPoints.update({
            id: userPointsRecord.data[0].id,
            points: userPoints - amount,
          });
        }

        setBets([...bets, newBetResponse.data as Bet]);
        setBetDialogOpen(false);
        setBetAmount('');
        setBetChoice(null);
        loadUserPoints();
        showSnackbar('Bet placed successfully', 'success');
      }
    } catch (error) {
      showSnackbar('Error placing bet', 'error');
    }
  };

  const handleResolvePoll = async (pollId: string, winner: BetChoice) => {
    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      // Update poll status
      await client.models.Poll.update({
        id: pollId,
        status: winner === 'A' ? 'RESOLVED_A' : 'RESOLVED_B',
      });

      // Get all bets for this poll
      const pollBets = bets.filter(bet => bet.pollId === pollId);
      const { totalA, totalB } = calculatePollTotals(pollId);
      const totalPool = totalA + totalB;
      const winningBets = pollBets.filter(bet => bet.choice === winner);
      const winningTotal = winner === 'A' ? totalA : totalB;

      for (const bet of winningBets) {
        const winningRatio = bet.amount / winningTotal;
        const winnings = Math.floor(totalPool * winningRatio);

        const userPointsRecord = await client.models.UserPoints.list({
          filter: { userId: { eq: bet.userId } }
        });

        if (userPointsRecord.data.length > 0) {
          await client.models.UserPoints.update({
            id: userPointsRecord.data[0].id,
            points: userPointsRecord.data[0].points + winnings,
          });
        }
      }

      loadPolls();
      loadUserPoints();
      showSnackbar('Poll resolved successfully', 'success');
    } catch (error) {
      showSnackbar('Error resolving poll', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Gambling Hall</Typography>
        <Box>
          <Typography variant="h6" component="span" sx={{ mr: 2 }}>
            Points: {userPoints}
          </Typography>
          <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
            Create Poll
          </Button>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={2}>
        {polls.map((poll) => {
          const { totalA, totalB } = calculatePollTotals(poll.id);
          return (
            <Card key={poll.id}>
              <CardContent>
                <Typography variant="h6">{poll.title}</Typography>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Box flex={1}>
                    <Typography variant="body1">
                      Option A: {poll.optionA} ({totalA} points)
                    </Typography>
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body1">
                      Option B: {poll.optionB} ({totalB} points)
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Status: {poll.status}
                </Typography>
              </CardContent>
              <CardActions>
                {poll.status === 'ACTIVE' && (
                  <>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedPoll(poll);
                        setBetDialogOpen(true);
                      }}
                    >
                      Place Bet
                    </Button>
                    {poll.creatorId === user.username && (
                      <>
                        <Button size="small" onClick={() => handleResolvePoll(poll.id, 'A')}>
                          Resolve A Wins
                        </Button>
                        <Button size="small" onClick={() => handleResolvePoll(poll.id, 'B')}>
                          Resolve B Wins
                        </Button>
                      </>
                    )}
                  </>
                )}
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {/* Create Poll Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Poll</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Poll Title"
            value={newPoll.title}
            onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Option A"
            value={newPoll.optionA}
            onChange={(e) => setNewPoll({ ...newPoll, optionA: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Option B"
            value={newPoll.optionB}
            onChange={(e) => setNewPoll({ ...newPoll, optionB: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePoll} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Place Bet Dialog */}
      <Dialog open={betDialogOpen} onClose={() => setBetDialogOpen(false)}>
        <DialogTitle>Place Bet</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bet Amount"
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            margin="normal"
          />
          <Box display="flex" gap={2} mt={2}>
            <Button
              variant={betChoice === 'A' ? 'contained' : 'outlined'}
              onClick={() => setBetChoice('A')}
              fullWidth
            >
              Option A
            </Button>
            <Button
              variant={betChoice === 'B' ? 'contained' : 'outlined'}
              onClick={() => setBetChoice('B')}
              fullWidth
            >
              Option B
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePlaceBet} variant="contained">
            Place Bet
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
