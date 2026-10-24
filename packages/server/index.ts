import express, { response } from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import z from 'zod';

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Define the schema for the request body
const chatSchema = z.object({
  prompt: z
    .string()
    .trim() //eliminate whitespace from both ends of the string
    .max(1000, 'Prompt must be at most 1000 characters long') // controls the maximum length of the prompt
    .min(1, 'Prompt must be at least 1 character long'),
  sessionHistory: z.string().uuid('Conversation history must be a valid UUID'),
});

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies
const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello there! my name is Mesh' });
});

// One history per session (UUID)
const sessionsHistory = new Map<
  string,
  Array<{ role: 'user' | 'assistant'; content: string }>
>();

app.post('/api/chat', async (req: Request, res: Response) => {
  const validatedData = chatSchema.safeParse(req.body);
  if (!validatedData.success) {
    return res
      .status(400)
      .json({ error: validatedData.error.issues.map((i) => i.message) });
  }

  const { prompt, sessionHistory: sessionID } = validatedData.data;

  // Get or create the session history for the given session ID
  const history = sessionsHistory.get(sessionID) || [];
  history.push({ role: 'user', content: prompt });

  try {
    // Append the current user message to history
    sessionsHistory.set(sessionID, history);

    // adding try-catch block to handle errors from the Groq API
    try {
      const response = await client.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: history,
        temperature: 0.2,
        max_tokens: 100,
      });

      const reply =
        response.choices[0]?.message.content ?? 'No response from model.';
      history.push({ role: 'assistant', content: reply });

      // Append the assistant's response to history
      sessionsHistory.set(sessionID, history);

      res.json({ message: reply });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate a response.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
