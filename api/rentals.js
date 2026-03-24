import mongoose from 'mongoose';

// MongoDB Connection Caching
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

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

const Rental = mongoose.models.Rental || mongoose.model('Rental', rentalSchema);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const rentals = await Rental.find().sort({ createdAt: -1 });
      return res.status(200).json(rentals);
    }

    if (req.method === 'POST') {
      const rentals = req.body;
      if (Array.isArray(rentals)) {
        const saved = await Rental.insertMany(rentals);
        return res.status(201).json(saved);
      } else {
        const rental = new Rental(rentals);
        const saved = await rental.save();
        return res.status(201).json(saved);
      }
    }

    if (req.method === 'DELETE') {
      // Extract ID from URL path - handle multiple formats
      let id = null;

      // Try to get from URL path
      if (req.url) {
        const urlParts = req.url.split('/').filter(part => part && part !== 'rentals');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart) {
          id = lastPart.split('?')[0]; // Remove query params
        }
      }

      // Fallback to query parameter
      if (!id && req.query?.id) {
        id = req.query.id;
      }

      console.log('DELETE request - URL:', req.url, 'Extracted ID:', id);

      if (!id || id === 'rentals' || id === '') {
        return res.status(400).json({ error: 'Rental ID is required', url: req.url });
      }

      // Validate MongoDB ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const deleted = await Rental.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Rental not found' });
      }
      return res.status(200).json({ message: 'Rental deleted successfully', deleted });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Serverless Error:', err);
    res.status(500).json({ error: err.message });
  }
}
