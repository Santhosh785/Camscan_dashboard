import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Rental Schema
const rentalSchema = new mongoose.Schema({
  slNo: String,
  name: String,
  phone: String,
  perDayRent: Number,
  rentDate: String,
  timeOut: String,
  product: String,
  returnDate: String,
  advanceAmt: Number,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});

const Rental = mongoose.model('Rental', rentalSchema);

// API Routes
app.get('/api/rentals', async (req, res) => {
  try {
    const rentals = await Rental.find().sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rentals', async (req, res) => {
  try {
    const rentals = req.body; // Can be single or array
    if (Array.isArray(rentals)) {
      const saved = await Rental.insertMany(rentals);
      res.json(saved);
    } else {
      const rental = new Rental(rentals);
      const saved = await rental.save();
      res.json(saved);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rentals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Rental.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    res.json({ message: 'Rental deleted successfully', deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
