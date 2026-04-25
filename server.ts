import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// Import our Vercel functions directly for local express handling
import analyzeSpeechHandler from './api/analyzeSpeech';
import generateInterviewQuestionsHandler from './api/generateInterviewQuestions';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount the serverless functions as regular Express routes for local development
  app.post('/api/analyzeSpeech', (req, res) => {
    // Vercel serverless functions exported as defaults
    return analyzeSpeechHandler(req as any, res as any);
  });

  app.post('/api/generateInterviewQuestions', (req, res) => {
    return generateInterviewQuestionsHandler(req as any, res as any);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
