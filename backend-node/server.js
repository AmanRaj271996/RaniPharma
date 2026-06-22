const express = require('express');
const cors = require('cors');
const { initialize } = require('./db');
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://localhost:4200',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicine', medicineRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB and start server
initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Rani Pharma API running on port ${PORT}`);
  });
});
