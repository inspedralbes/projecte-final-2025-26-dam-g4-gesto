const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api',require('./routes/dataset'));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor inicialitzat al port: ${PORT}`));