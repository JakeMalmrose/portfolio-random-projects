import { Container, Typography, Box } from '@mui/material';

const Resume = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h1" gutterBottom>
          Resume
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resume content will be added here...
        </Typography>
      </Box>
    </Container>
  );
};

export default Resume;