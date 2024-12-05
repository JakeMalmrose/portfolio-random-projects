import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Link
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import GitHubIcon from '@mui/icons-material/GitHub';

const Project = ({ title, date, description, techStack, links = {} }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {date}
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        {description.map((point, index) => (
          <Typography key={index} variant="body1" paragraph>
            {point}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {techStack.map((tech) => (
          <Chip
            key={tech}
            label={tech}
            variant="outlined"
            color="primary"
            size="small"
          />
        ))}
      </Box>
    </CardContent>
    <CardActions sx={{ p: 2, pt: 0 }}>
      {links.demo && (
        <Button
          startIcon={<LaunchIcon />}
          href={links.demo}
          target="_blank"
          rel="noopener noreferrer"
        >
          Live Demo
        </Button>
      )}
      {links.github && (
        <Button
          startIcon={<GitHubIcon />}
          href={links.github}
          target="_blank"
          rel="noopener noreferrer"
        >
          Source Code
        </Button>
      )}
    </CardActions>
  </Card>
);

const Projects = () => {
  const projects = [
    {
      title: "NewsBites",
      date: "SEP 2024 – CURRENT",
      description: [
        "Built an AI Powered News Summarization Website. Integrated AI tool calling, prompt engineering, and AI driven data transformation.",
        "Used state of the art generative AI models to transform data, and streamline UX.",
        "Processed 1000's of news articles, extracted key details with ML. Used prompt engineering and prompt caching to reduce latency below 0.5 seconds."
      ],
      techStack: ["React", "Typescript", "AWS", "Amplify", "Generative AI"],
      links: {
        demo: "https://news.malmrose.com/",
        github: "https://github.com/JakeMalmrose/Capstone"
      }
    },
    {
      title: "Vapor",
      date: "APR 2024 – MAY 2024",
      description: [
        "Architected and implemented a scalable game distribution platform using microservices architecture in Go",
        "Featuring user authentication, game management, shopping cart functionality, and admin controls"
      ],
      techStack: ["Golang", "Microservices", "Authentication", "Event-Driven Architecture"],
      links: {
        github: "https://github.com/JakeMalmrose/groupProjPro290"
      }
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 8 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 6
          }}
        >
          Projects
        </Typography>
        <Grid container spacing={4}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} key={project.title}>
              <Project {...project} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Projects;