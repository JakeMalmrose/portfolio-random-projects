import { Container, Typography, Box, Button } from '@mui/material';

const NewsBites = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8 }}>
        <Typography variant="h1" gutterBottom>
          NewsBites
        </Typography>
        <Typography variant="body1" paragraph>
          NewsBites is my capstone project that delivers concise, AI-powered news summaries.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="https://news.malmrose.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit NewsBites
        </Button>
      </Box>
    </Container>
  );
};

export default NewsBites;