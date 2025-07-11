const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ambulance-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📁 Database:', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.error('🔍 Connection string:', process.env.MONGODB_URI ? 'MongoDB Atlas (hidden)' : 'Local MongoDB');
});

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'driver', 'admin'], required: true },
  available: { type: Boolean, default: true }, // For drivers
  location: {
    lat: Number,
    lng: Number,
    timestamp: Date
  },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupAddress: { type: String, required: true },
  pickupLocation: { type: String, required: true }, // "lat,lng"
  destinationAddress: { type: String, required: true },
  destinationLocation: { type: String, required: true }, // "lat,lng"
  medicalCondition: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled'],
    default: 'pending'
  },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estimatedArrival: Date,
  actualArrival: Date,
  completedAt: Date,
  emergencyContact: String,
  emergencyContactPhone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      available: role === 'driver' ? true : undefined
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Booking Routes
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      patientId: req.user.id
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Notify admins about new booking
    io.emit('newBooking', booking);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.query;
    let query = {};

    if (role === 'patient') {
      query.patientId = userId || req.user.id;
    } else if (role === 'driver') {
      query.driver = userId || req.user.id;
    }
    // Admin can see all bookings

    const bookings = await Booking.find(query)
      .populate('driver', 'name phone email')
      .populate('patientId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('driver', 'name phone email location')
      .populate('patientId', 'name phone email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role === 'patient' && booking.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'driver' && booking.driver && booking.driver._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

app.patch('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking status
    booking.status = status;
    booking.updatedAt = new Date();

    if (status === 'completed') {
      booking.completedAt = new Date();
      // Make driver available again
      if (booking.driver) {
        await User.findByIdAndUpdate(booking.driver, { available: true });
      }
    }

    await booking.save();
    await booking.populate('driver', 'name phone email location');

    // Notify all clients about the update
    io.emit('bookingUpdated', booking);

    res.json(booking);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

app.patch('/api/bookings/:id/assign', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign drivers' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Assign driver and update status
    booking.driver = driverId;
    booking.status = 'assigned';
    booking.updatedAt = new Date();
    
    // Set estimated arrival (mock calculation)
    booking.estimatedArrival = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    await booking.save();
    await booking.populate('driver', 'name phone email location');

    // Make driver unavailable
    driver.available = false;
    await driver.save();

    // Notify all clients about the update
    io.emit('bookingUpdated', booking);

    res.json(booking);
  } catch (error) {
    console.error('Driver assignment error:', error);
    res.status(500).json({ message: 'Failed to assign driver' });
  }
});

// Driver Routes
app.get('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('-password')
      .sort({ name: 1 });

    res.json(drivers);
  } catch (error) {
    console.error('Fetch drivers error:', error);
    res.status(500).json({ message: 'Failed to fetch drivers' });
  }
});

app.patch('/api/drivers/location', authenticateToken, async (req, res) => {
  try {
    const { location } = req.body;
    
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can update location' });
    }

    const driver = await User.findByIdAndUpdate(
      req.user.id,
      { 
        location: {
          ...location,
          timestamp: new Date()
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    // Notify all clients about driver location update
    io.emit('driverLocationUpdated', {
      driverId: req.user.id,
      location: location
    });

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join room for real-time updates
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  // Handle location updates from drivers
  socket.on('updateLocation', (data) => {
    socket.broadcast.emit('driverLocationUpdated', data);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 MongoDB Status: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  
  // Check environment variables
  if (process.env.MONGODB_URI) {
    console.log('🔗 Using MongoDB Atlas connection');
  } else {
    console.log('🔗 Using local MongoDB connection');
  }
});
