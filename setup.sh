#!/bin/bash

# Ambulance Booking App Setup Script

echo "🚑 Setting up Ambulance Booking App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Run: mongod"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

cd server
npm install
cd ..

# Copy environment file
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "📝 Created .env file. Please update with your configuration."
fi

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Ambulance Booking App..."

# Start backend in background
cd server
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Start frontend
cd ..
npm start &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $SERVER_PID $FRONTEND_PID
    exit 0
}

# Trap ctrl+c and call cleanup
trap cleanup INT

# Wait for both processes
wait $SERVER_PID $FRONTEND_PID
EOF

chmod +x start.sh

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update server/.env with your configuration"
echo "2. Make sure MongoDB is running: mongod"
echo "3. Start the app: ./start.sh"
echo "   OR start manually:"
echo "   - Backend: cd server && npm start"
echo "   - Frontend: npm start"
echo ""
echo "📱 Access the app at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "👥 Test accounts to create:"
echo "   - Patient: Register with role 'patient'"
echo "   - Driver: Register with role 'driver'"
echo "   - Admin: Register with role 'admin'"
