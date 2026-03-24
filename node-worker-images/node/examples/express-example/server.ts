import express from 'express';

const app = express();

app.get('/', (req: any, res: any) => {
  res.send('Hello World from Express!');
});

// do not remove this line, it's needed for tests
export default app;