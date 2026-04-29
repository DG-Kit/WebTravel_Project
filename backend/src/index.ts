import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tagRoutes from './routes/tag.routes';
import locationRoutes from './routes/location.routes';
import attractionRoutes from './routes/attraction.routes';
import hotelRoutes from './routes/hotel.routes';
import bookingRoutes from './routes/booking.routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();
const port = process.env.PORT || 8080;

// Validate essential environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// ========================
// Global Middlewares
// ========================
app.use(cors());
app.use(express.json());

// Global JSON serializer: BigInt → string, Prisma Decimal → number, Date → ISO string
app.set('json replacer', (_key: string, value: any) => {
  if (typeof value === 'bigint') return value.toString();
  // Prisma Decimal: duck-typed by .toFixed() + .toNumber() (constructor may be minified)
  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !Array.isArray(value) &&
    typeof value.toFixed === 'function' &&
    typeof value.toNumber === 'function'
  ) {
    return value.toNumber();
  }
  return value;
});

// ========================
// Routes
// ========================
app.get('/', (req, res) => {
  res.json({ success: true, message: 'WebTravel Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);

// ========================
// Error Handling
// ========================
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

