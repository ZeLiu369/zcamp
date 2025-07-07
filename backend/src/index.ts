import express, { Request, Response } from 'express';

const app = express();
const port = 3001; // We'll use 3001 for the backend server

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Express Backend!');
});

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});