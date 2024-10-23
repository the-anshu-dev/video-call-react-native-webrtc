// const express = require('express');
// const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(express.json());
// app.use(cookieParser());
// app.use(cors({ origin: true, credentials: true }));

// // Import routes
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/user');

// // Use routes
// app.use('/api/v1', authRoutes);
// app.use('/api/v1', userRoutes);





// const MONGO_URI = process.env.MONGO_URI;

// if (!MONGO_URI) {
//   throw new Error('MONGO_URI is not defined in the .env file');
// }

// mongoose.connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch((err) => console.error('MongoDB connection error:', err));



// // Connect to MongoDB and start the server
// const PORT = process.env.PORT || 8000;
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
//     .catch((err) => console.log(err));
















require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000', // Adjust this if the frontend runs on a different port
    credentials: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Sample User Schema (MongoDB)
const userSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware for Auth
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

// Routes

// 1. Get Logged-in User
app.get('/api/v1/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

// 2. Login
app.post('/api/v1/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Validate password (assuming password is hashed)
        const isMatch = password === user.password; // Replace with bcrypt comparison in a real app
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Generate JWT
        const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict'
        }).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. User List
app.get('/api/v1/user-list', authenticate, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// 4. Save Token (for example: FCM token)
app.post('/api/v1/save-token', authenticate, (req, res) => {
    const { token } = req.body;
    // You can save the token to a database for notification purposes
    res.json({ message: 'Token received', token });
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
