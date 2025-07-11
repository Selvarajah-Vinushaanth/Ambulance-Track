# 🚑 Ambulance Booking App

A comprehensive full-stack ambulance booking application with real-time GPS tracking, multiple user roles, and modern UI. Built with React, Node.js, MongoDB, and Socket.IO.

## 🌟 Features

### 👥 Multi-User System
- **Patients**: Book ambulances, track in real-time
- **Drivers**: Receive bookings, update location, manage status
- **Admins**: Manage all bookings, assign drivers, monitor system

### 📍 GPS Tracking
- Real-time location tracking using phone IP geolocation
- Interactive maps with live ambulance positions
- Estimated arrival times
- Route visualization

### 🔄 Real-Time Updates
- Live booking status updates
- Real-time location tracking
- Socket.IO for instant notifications
- Automatic dashboard refreshes

### 🎯 Booking Management
- Priority-based booking system (Low, Medium, High)
- Comprehensive booking details
- Status tracking (Pending → Assigned → En Route → Arrived → Completed)
- Emergency contact management

### 🛡️ Security & Performance
- JWT-based authentication
- Rate limiting
- Input validation
- CORS protection
- Helmet security middleware

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ambulance-booking-app
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the environment file
   cp server/.env.example server/.env
   
   # Edit the .env file with your configuration
   # Change JWT_SECRET to a secure random string
   # Update MongoDB connection string if needed
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Run the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # OR start them separately:
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 User Roles & Access

### Patient Account
- Register as a "Patient"
- Book ambulances with medical details
- Track ambulance location in real-time
- View booking history
- Emergency contact management

### Driver Account
- Register as a "Driver"
- Receive assigned bookings
- Update location automatically
- Change booking status (En Route, Arrived, Completed)
- View earnings and trip history

### Admin Account
- Register as an "Admin"
- View all bookings and drivers
- Assign drivers to bookings
- Monitor system performance
- Manage user accounts

## 🗺️ GPS Features

### Location Tracking Methods
1. **IP-based Geolocation**: Automatic approximate location
2. **Browser GPS**: High-accuracy location (requires user permission)
3. **Manual Entry**: Coordinates and addresses

### Real-Time Tracking
- Driver location updates every 30 seconds
- Live map visualization
- Distance calculations
- ETA estimations

## 🔧 Technical Architecture

### Frontend (React)
- **Framework**: React 18 with Hooks
- **Routing**: React Router DOM
- **State Management**: Context API
- **Styling**: Styled Components
- **Maps**: React Leaflet + OpenStreetMap
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

### Database Schema
```javascript
// User Schema
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: ['patient', 'driver', 'admin'],
  location: { lat: Number, lng: Number },
  available: Boolean, // for drivers
  createdAt: Date
}

// Booking Schema
{
  patientName: String,
  patientPhone: String,
  patientId: ObjectId,
  pickupAddress: String,
  pickupLocation: String, // "lat,lng"
  destinationAddress: String,
  destinationLocation: String,
  medicalCondition: String,
  priority: ['low', 'medium', 'high'],
  status: ['pending', 'assigned', 'en_route', 'arrived', 'completed'],
  driver: ObjectId,
  estimatedArrival: Date,
  createdAt: Date
}
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update booking status
- `PATCH /api/bookings/:id/assign` - Assign driver (admin only)

### Drivers
- `GET /api/drivers` - Get all drivers
- `PATCH /api/drivers/location` - Update driver location

### System
- `GET /api/health` - Health check

## 🎨 UI/UX Features

### Modern Design
- Clean, medical-themed interface
- Responsive design for all devices
- Dark/light mode support
- Smooth animations and transitions

### User Experience
- Intuitive booking flow
- Real-time status updates
- Interactive maps
- Quick actions and shortcuts
- Mobile-optimized interface

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Protected routes
- Token expiration handling

### Data Security
- Password hashing (bcrypt)
- Input validation and sanitization
- CORS protection
- Rate limiting
- SQL injection prevention

## 📊 Monitoring & Analytics

### Real-Time Metrics
- Active bookings count
- Driver availability
- Response times
- System performance

### Booking Analytics
- Booking completion rates
- Average response times
- Peak usage patterns
- Geographic distribution

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   JWT_SECRET=your-secure-secret-key
   MONGODB_URI=your-production-mongodb-uri
   ```

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Deploy Backend**
   ```bash
   # Deploy to your preferred platform
   # (Heroku, AWS, DigitalOcean, etc.)
   ```

### Docker Support
```dockerfile
# Dockerfile included for containerization
docker build -t ambulance-app .
docker run -p 3000:3000 -p 5000:5000 ambulance-app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@ambulanceapp.com or create an issue in the GitHub repository.

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced routing algorithms
- [ ] Payment integration
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Insurance integration
- [ ] Telemedicine features

---

**⚠️ Important Notes:**
- This is a demonstration application
- Use appropriate medical protocols for production
- Ensure compliance with healthcare regulations
- Test thoroughly before production deployment
- Always use HTTPS in production
- Implement proper error monitoring
