require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const User = require('./models/User');
const Notification = require('./models/Notification');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Database
connectDB();

// Initialize Socket.IO
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store socket io instance to express app to use in controllers
app.set('socketio', io);

// Socket.IO Events handler
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // User registers their room using user ID
  socket.on('join-room', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`Socket ${socket.id} joined room: ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// Periodically check for users who haven't journaled today and send reminders
// In a production app this would run as a daily cron job. Here we run it every 15 minutes,
// logging notifications to users.
const runDailyReminderCheck = async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const users = await User.find({});

    for (const user of users) {
      if (user.lastJournalDate !== todayStr) {
        // Check if reminder was already created today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const existingReminder = await Notification.findOne({
          userId: user._id,
          type: 'reminder',
          createdAt: { $gte: startOfDay }
        });

        if (!existingReminder) {
          const reminder = await Notification.create({
            userId: user._id,
            title: 'Daily Reminder',
            message: "You haven't written today's journal yet. Take 2 minutes to record your thoughts!",
            type: 'reminder'
          });

          // Emit real-time notification
          io.to(user._id.toString()).emit('new-notification', reminder);
          console.log(`Emitted daily reminder notification to user: ${user.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error running daily reminder check:', error.message);
  }
};

// Run check 10 seconds after server startup, then every 15 minutes
setTimeout(runDailyReminderCheck, 10000);
setInterval(runDailyReminderCheck, 15 * 60 * 1000);

// Mounting routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/journals', require('./routes/journals'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/trackers', require('./routes/trackers'));
app.use('/api/admin', require('./routes/admin'));

// Notifications Route (to list them for the client)
app.get('/api/notifications', async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mood_journal_ai_jwt_secret_token_2026_key');
    
    // Mark all as read when they fetch notifications (optional) or just list them
    const notifications = await Notification.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
});

// Mark notifications as read route
app.put('/api/notifications/read', async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mood_journal_ai_jwt_secret_token_2026_key');
    await Notification.updateMany({ userId: decoded.id, read: false }, { read: true });
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Catch-all route for invalid endpoints
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Centralized error handler
app.use(errorHandler);

const PORT = 5002;
server.listen(PORT, () => {
  console.log(`Server running in production mode on port ${PORT}`);
});
