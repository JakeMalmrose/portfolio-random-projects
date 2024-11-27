import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
            fontWeight: 'bold',
          }}
        >
          Jake Malmrose
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/newsbites"
            color="inherit"
          >
            NewsBites
          </Button>
          <Button
            component={RouterLink}
            to="/projects"
            color="inherit"
          >
            Projects
          </Button>
          <Button
            component={RouterLink}
            to="/resume"
            color="inherit"
          >
            Resume
          </Button>
          <Button
            component={RouterLink}
            to="/gambling"
            color="inherit"
          >
            Gambling
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
