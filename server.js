const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret';

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const MONGO_URI = 'mongodb+srv://jcasas5253:Drums4life!@cluster0.arafzxf.mongodb.net/myDatabase?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);

    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Token validation endpoint
app.get('/api/validateToken', authenticateToken, (req, res) => {
    res.json({ message: 'Token is valid' });
});

// Endpoint to get username
app.get('/api/getUsername', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.sendStatus(404); // User not found
        }
        res.json({ username: user.username });
    } catch (error) {
        console.error(error);
        res.sendStatus(500); // Internal server error
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password, confirmPassword } = req.body;

    // Remove capitalization logic to save username exactly as entered
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        username, // Save exactly as entered
        password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

app.post('/api/logout', (req, res) => {
    // On the server side, there's no real way to invalidate JWTs,
    // but you can handle this by adding a blacklist or updating the client to delete the token.
    res.json({ message: 'Logged out' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
