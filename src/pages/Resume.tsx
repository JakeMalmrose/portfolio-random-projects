import React from 'react';
import { Container, Typography, Box, Chip, Paper, Grid, Link } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';

const Resume = () => {
  const skills = {
    proficient: ['JavaScript', 'React', 'AWS', 'Python', 'Git', 'Golang', 'AI Integration', 'Docker'],
    intermediate: ['C#', 'C++', 'Linux', 'Vue', 'Java', 'Jira'],
    learning: ['Flutter', 'Figma', 'Websockets']
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 8 }}>
        {/* Header Section */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Jake Malmrose
          </Typography>
          <Typography variant="h4" color="text.secondary" gutterBottom>
            Software Engineer | AI Integration Specialist
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Link href="mailto:jake.malmrose@gmail.com" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon /> jake.malmrose@gmail.com
            </Link>
            <Link href="tel:510-325-6879" color="inherit">510-325-6879</Link>
            <Link href="https://github.com/JakeMalmrose" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GitHubIcon /> GitHub
            </Link>
            <Link href="https://www.linkedin.com/in/jake-malmrose/" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LinkedInIcon /> LinkedIn
            </Link>
            <Link href="https://www.malmrose.com" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LanguageIcon /> Portfolio
            </Link>
          </Box>
        </Box>

        {/* Objective Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Objective
          </Typography>
          <Typography variant="body1">
            Software Engineer focused on developing distributed systems, microservices-based architectures, and monolithic applications. I have expertise in Go, React, Java, and AWS. Experienced in building scalable full-stack applications with both traditional and AI-enhanced functionalities.
          </Typography>
        </Paper>

        {/* Skills Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Skills
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Proficient
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {skills.proficient.map((skill) => (
                <Chip key={skill} label={skill} color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Intermediate
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {skills.intermediate.map((skill) => (
                <Chip key={skill} label={skill} color="secondary" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Actively Learning
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {skills.learning.map((skill) => (
                <Chip key={skill} label={skill} variant="outlined" />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Experience Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Industry Experience
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="h6">NewsBites</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                SEP 2024 – CURRENT
              </Typography>
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Software Engineer | Neumont Senior Capstone Project
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <Typography component="li" variant="body1" gutterBottom>
                Built an AI Powered News Summarization Website. Integrated AI tool calling, prompt engineering, and AI driven data transformation.
              </Typography>
              <Typography component="li" variant="body1" gutterBottom>
                Used state of the art generative AI models to transform data, and streamline UX.
              </Typography>
              <Typography component="li" variant="body1" gutterBottom>
                Processed 1000's of news articles, extracted key details with ML. Used prompt engineering and prompt caching to reduce latency below 0.5 seconds.
              </Typography>
              <Typography component="li" variant="body1">
                Tech stack: React | Typescript | AWS | Amplify | Generative AI
              </Typography>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="h6">Vapor</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                APR 2024 – MAY 2024
              </Typography>
            </Box>
            <Typography variant="subtitle1" gutterBottom>
              Software Developer | Neumont Collaborative Project
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <Typography component="li" variant="body1" gutterBottom>
                Architected and implemented a scalable game distribution platform using microservices architecture in Go
              </Typography>
              <Typography component="li" variant="body1" gutterBottom>
                Featuring user authentication, game management, shopping cart functionality, and admin controls
              </Typography>
              <Typography component="li" variant="body1">
                Tech stack: Golang | Microservices | Authentication | Event-Driven Architecture
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Education Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Education
          </Typography>
          <Typography variant="h6">
            Neumont College of Computer Science
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            BS in Software Engineering
          </Typography>
          <Typography variant="body1" color="text.secondary">
            SLC, UT | GPA: 3.9/4.0
          </Typography>
        </Paper>

        {/* Achievements Section */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Achievements
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body1" gutterBottom>
              Neumont Esports League of Legends Team Captain (1.5 years)
            </Typography>
            <Typography component="li" variant="body1">
              Neumont Achievement Scholarship
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Resume;