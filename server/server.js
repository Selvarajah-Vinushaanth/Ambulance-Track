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

// Rate limiting - Very high limits for better user experience
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100000 // limit each IP to 100,000 requests per minute (very high)
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
  profilePicture: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    medicalConditions: [String]
  },
  driverInfo: {
    licenseNumber: String,
    vehicleType: String,
    vehicleNumber: String,
    experience: Number,
    rating: { type: Number, default: 5 },
    totalRides: { type: Number, default: 0 }
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  },
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
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
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
  additionalInfo: {
    wheelchairRequired: { type: Boolean, default: false },
    oxygenRequired: { type: Boolean, default: false },
    stretcherRequired: { type: Boolean, default: false },
    specialInstructions: String
  },
  pricing: {
    baseFare: { type: Number, default: 50 },
    distanceFare: Number,
    totalFare: Number,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    paymentMethod: String
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  route: {
    distance: Number,
    duration: Number,
    path: [{ lat: Number, lng: Number }]
  },
  timeline: [{
    status: String,
    timestamp: Date,
    location: { lat: Number, lng: Number },
    notes: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'system', 'emergency', 'payment'], required: true },
  read: { type: Boolean, default: false },
  actionUrl: String,
  createdAt: { type: Date, default: Date.now }
});

// Hospital Schema
const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  phone: { type: String, required: true },
  email: String,
  specialties: [String],
  emergencyServices: { type: Boolean, default: true },
  rating: { type: Number, default: 5 },
  capacity: {
    total: Number,
    available: Number,
    icu: Number,
    emergency: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  cancelledBookings: { type: Number, default: 0 },
  averageResponseTime: Number,
  averageRating: Number,
  totalRevenue: { type: Number, default: 0 },
  activeDrivers: { type: Number, default: 0 },
  peakHours: [{
    hour: Number,
    bookings: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Hospital = mongoose.model('Hospital', hospitalSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

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

    // Calculate estimated fare
    const baseFare = 50;
    const distanceFare = (req.body.route?.distance || 10) * 2; // $2 per km
    const totalFare = baseFare + distanceFare;
    
    bookingData.pricing = {
      baseFare,
      distanceFare,
      totalFare,
      paymentStatus: 'pending'
    };

    // Add initial timeline entry
    bookingData.timeline = [{
      status: 'pending',
      timestamp: new Date(),
      notes: 'Booking created'
    }];

    const booking = new Booking(bookingData);
    await booking.save();

    // Create notification for admins
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      const notification = new Notification({
        userId: admin._id,
        title: 'New Booking Request',
        message: `New ${req.body.priority} priority booking from ${req.body.patientName}`,
        type: 'booking',
        actionUrl: `/admin/bookings/${booking._id}`
      });
      await notification.save();
    }

    // Notify admins about new booking
    io.emit('newBooking', booking);
    io.emit('newNotification', { 
      type: 'booking', 
      message: 'New booking request received',
      booking: booking 
    });

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

// Notification endpoints
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Hospital endpoints
app.get('/api/hospitals', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    let hospitals;
    if (lat && lng) {
      // Find hospitals within radius
      hospitals = await Hospital.find({
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371]
          }
        }
      }).sort({ rating: -1 });
    } else {
      hospitals = await Hospital.find({}).sort({ rating: -1 });
    }
    
    res.json(hospitals);
  } catch (error) {
    console.error('Fetch hospitals error:', error);
    res.status(500).json({ message: 'Failed to fetch hospitals' });
  }
});

app.post('/api/hospitals', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add hospitals' });
    }
    
    const hospital = new Hospital(req.body);
    await hospital.save();
    res.status(201).json(hospital);
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ message: 'Failed to create hospital' });
  }
});

// Analytics endpoints
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view analytics' });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's stats with proper revenue calculation
    const todayStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$pricing.totalFare', null] }] },
                '$pricing.totalFare',
                0
              ]
            }
          }
        }
      }
    ]);

    // Weekly stats with revenue
    const weeklyStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$pricing.totalFare', null] }] },
                '$pricing.totalFare',
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Monthly stats
    const monthlyStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$pricing.totalFare', null] }] },
                '$pricing.totalFare',
                0
              ]
            }
          }
        }
      }
    ]);

    // Active drivers
    const activeDrivers = await User.countDocuments({ role: 'driver', available: true });
    const totalDrivers = await User.countDocuments({ role: 'driver' });

    // Average rating from completed bookings
    const avgRating = await Booking.aggregate([
      { $match: { 'feedback.rating': { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, totalRatings: { $sum: 1 } } }
    ]);

    // Peak hours analysis
    const peakHours = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 }
    ]);

    // Priority distribution
    const priorityDistribution = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Response time analysis
    const responseTimeStats = await Booking.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfWeek },
          status: { $in: ['assigned', 'en_route', 'arrived', 'completed'] }
        } 
      },
      {
        $project: {
          responseTime: {
            $subtract: ['$updatedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    // Driver performance
    const driverPerformance = await Booking.aggregate([
      { 
        $match: { 
          driver: { $ne: null },
          status: 'completed',
          'feedback.rating': { $exists: true }
        } 
      },
      {
        $group: {
          _id: '$driver',
          totalRides: { $sum: 1 },
          avgRating: { $avg: '$feedback.rating' },
          totalRevenue: { $sum: '$pricing.totalFare' }
        }
      },
      { $sort: { totalRides: -1 } },
      { $limit: 10 }
    ]);

    // Popular routes
    const popularRoutes = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      {
        $group: {
          _id: {
            pickup: '$pickupAddress',
            destination: '$destinationAddress'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      today: todayStats[0] || { totalBookings: 0, completedBookings: 0, cancelledBookings: 0, pendingBookings: 0, totalRevenue: 0 },
      monthly: monthlyStats[0] || { totalBookings: 0, completedBookings: 0, totalRevenue: 0 },
      weekly: weeklyStats,
      activeDrivers,
      totalDrivers,
      averageRating: avgRating[0]?.avgRating || 0,
      totalRatings: avgRating[0]?.totalRatings || 0,
      peakHours,
      priorityDistribution,
      responseTime: responseTimeStats[0] || { avgResponseTime: 0, minResponseTime: 0, maxResponseTime: 0 },
      driverPerformance,
      popularRoutes
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Enhanced booking feedback
app.post('/api/bookings/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role === 'patient' && booking.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };
    await booking.save();

    // Update driver rating if applicable
    if (booking.driver) {
      const driver = await User.findById(booking.driver);
      if (driver) {
        driver.driverInfo.totalRides = (driver.driverInfo.totalRides || 0) + 1;
        const currentRating = driver.driverInfo.rating || 5;
        const totalRides = driver.driverInfo.totalRides;
        driver.driverInfo.rating = ((currentRating * (totalRides - 1)) + rating) / totalRides;
        await driver.save();
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Emergency alert endpoint
app.post('/api/emergency-alert', authenticateToken, async (req, res) => {
  try {
    const { location, message } = req.body;
    
    // Create emergency booking
    const emergencyBooking = new Booking({
      patientName: req.user.name,
      patientPhone: req.user.phone || 'Unknown',
      patientId: req.user.id,
      pickupAddress: 'Emergency Location',
      pickupLocation: `${location.lat},${location.lng}`,
      destinationAddress: 'Nearest Hospital',
      destinationLocation: `${location.lat},${location.lng}`,
      medicalCondition: message || 'Emergency situation',
      priority: 'critical',
      status: 'pending',
      additionalInfo: {
        specialInstructions: 'EMERGENCY ALERT - Immediate response required'
      }
    });

    await emergencyBooking.save();

    // Notify all admins and available drivers
    const adminUsers = await User.find({ role: 'admin' });
    const availableDrivers = await User.find({ role: 'driver', available: true });
    
    const allUsers = [...adminUsers, ...availableDrivers];
    
    for (const user of allUsers) {
      const notification = new Notification({
        userId: user._id,
        title: '🚨 EMERGENCY ALERT',
        message: `Emergency request from ${req.user.name}: ${message}`,
        type: 'emergency',
        actionUrl: `/bookings/${emergencyBooking._id}`
      });
      await notification.save();
    }

    // Send real-time emergency alert
    io.emit('emergencyAlert', {
      booking: emergencyBooking,
      location,
      message,
      user: req.user
    });

    res.status(201).json(emergencyBooking);
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ message: 'Failed to send emergency alert' });
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
