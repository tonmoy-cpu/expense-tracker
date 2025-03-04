const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Define Transaction Schema
const transactionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API Routes
app.get('/api/transactions', async (req, res) => {
  const transactions = await Transaction.find();
  res.json(transactions);
});

app.post('/api/transactions', async (req, res) => {
  const newTransaction = new Transaction(req.body);
  await newTransaction.save();
  res.json(newTransaction);
});

app.delete('/api/transactions/:id', async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ message: 'Transaction deleted' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});