import { Container, Typography, Box } from '@mui/material';

const Projects = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h1" gutterBottom>
          My Projects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Coming soon...
        </Typography>
      </Box>
    </Container>
  );
};

export default Projects;