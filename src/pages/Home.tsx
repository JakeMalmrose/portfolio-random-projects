import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            background: 'linear-gradient(45deg, #bb86fc 30%, #cf6679 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
          }}
        >
          Welcome to My Portfolio
        </Typography>
        <Typography
          variant="h2"
          color="text.secondary"
          sx={{ textAlign: 'center', mb: 4 }}
        >
          Full Stack Developer
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            component={RouterLink}
            to="/newsbites"
            variant="contained"
            color="primary"
            size="large"
          >
            View NewsBites
          </Button>
          <Button
            component={RouterLink}
            to="/projects"
            variant="outlined"
            color="secondary"
            size="large"
          >
            See My Projects
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;