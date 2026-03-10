import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();
const port = process.env.PORT || 8080;

// ========================
// Global Middlewares
// ========================
app.use(cors());
app.use(express.json());

// ========================
// Routes
// ========================
app.get('/', (req, res) => {
  res.json({ success: true, message: 'WebTravel Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ========================
// Error Handling
// ========================
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
