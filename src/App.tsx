import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navbar from './components/NavBar';
import Home from './pages/Home.tsx';
import Projects from './pages/Projects.tsx';
import NewsBites from './pages/NewsBites.tsx';
import Resume from './pages/Resume.tsx';
import SkillCheckGame from './pages/Skillcheckgame.tsx';
import GamblingMiddleware from './pages/GamblingMiddleware.tsx';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bb86fc', // Purple accent
    },
    secondary: {
      main: '#cf6679', // Pink accent
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/newsbites" element={<NewsBites />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/skillcheck" element={<SkillCheckGame />} />
          <Route path="/gambling" element={<GamblingMiddleware />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
