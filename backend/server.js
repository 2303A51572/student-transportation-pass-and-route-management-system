const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'Student Transportation Pass and Route Management System',
    student: 'ETURI BALAJI (2303A51572)',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/passes', require('./routes/passRoutes'));
app.use('/api/renewals', require('./routes/renewalRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/transport-managers', require('./routes/managerRoutes'));

// Serve frontend static assets if built
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log(`[Frontend] Serving static production build from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 & Error Handling for API routes or unserved paths
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Database is clean. Running initial seeder automatically...');
      const { runSeed } = require('./seed/seedData');
      await runSeed();
    }

    app.listen(PORT, () => {
      console.log(`=================================================================`);
      console.log(` University Student Transportation Management System Server`);
      console.log(` Project: DevOps and Full Stack Development (2026-2027)`);
      console.log(` Developer: ETURI BALAJI | Enrolment No: 2303A51572`);
      console.log(` Backend running on http://localhost:${PORT}`);
      console.log(` API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=================================================================`);
    });
  } catch (err) {
    console.error(`Failed to launch server: ${err.message}`);
    process.exit(1);
  }
};

startServer();
