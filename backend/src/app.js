import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes        from './routes/auth.js';
import usersRoutes       from './routes/users.js';
import appointmentsRoutes from './routes/appointments.js';
import patientsRoutes    from './routes/patients.js';
import healthRoutes      from './routes/health.js';
import auditRoutes       from './routes/audit.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin:         process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',         authRoutes);
app.use('/api/users',        usersRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/patients',     patientsRoutes);
app.use('/api/health',       healthRoutes);
app.use('/api/audit',        auditRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: { message: 'Not Found' } });
});

// Global error handler (catches async throws)
app.use((err, req, res, _next) => {
  console.error(err);
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ ok: false, error: { message } });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
