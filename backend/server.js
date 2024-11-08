const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Importing routes
const userRoutes = require('./routes/userRoutes');
const codeRoutes = require('./routes/codeRoutes');

// Use routes
app.use(userRoutes);
app.use(codeRoutes);

// Start the server
app.listen(port, () => {
  console.log('Server running at http://localhost:${port}');
});