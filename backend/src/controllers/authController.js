const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-shared-between-node-and-flask';

const buildUserResponse = (user) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
    institution: user.institution || null
});

exports.register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, institution } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            first_name: first_name || 'Student',
            last_name: last_name || '',
            phone: phone || null,
            institution: institution || null
        });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.status(201).json({ token, user: buildUserResponse(user) });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: buildUserResponse(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: buildUserResponse(user) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'phone', 'institution', 'password', 'created_at'],
            order: [['created_at', 'DESC']]
        });
        res.json(users);
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

const nodemailer = require('nodemailer');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User with this email does not exist' });

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Generate reset token containing the hashed OTP
        const resetToken = jwt.sign({ email: user.email, otp: hashedOtp, purpose: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
        
        // Use Nodemailer if credentials are provided in .env
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"EmoLearn Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Your Password Reset OTP',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">EmoLearn</h1>
                            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Smart Emotion Based Learning</p>
                        </div>
                        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                            <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
                            <p style="color: #334155; line-height: 1.6;">Hello,</p>
                            <p style="color: #334155; line-height: 1.6;">We received a request to reset your password for your EmoLearn account. Your One-Time Password (OTP) is:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background-color: #eef2ff; padding: 15px 25px; border-radius: 8px; border: 1px dashed #a5b4fc;">${otp}</span>
                            </div>
                            <p style="color: #334155; line-height: 1.6;">Enter this code along with your new password on the reset page. This code will expire in <strong>15 minutes</strong>.</p>
                            <p style="color: #94a3b8; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Password recovery OTP sent to ${user.email}`);
            return res.json({ message: 'An OTP has been sent to your email.', token: resetToken });
        } else {
            // No SMTP config — return the OTP and token directly so the frontend can use it
            console.log(`\n================ PASSWORD RECOVERY OTP ================`);
            console.log(`Email: ${user.email}`);
            console.log(`OTP:   ${otp}`);
            console.log(`=======================================================\n`);
            return res.json({ 
                message: 'No email service configured. OTP generated for development mode.',
                otp: otp,
                token: resetToken,
                devMode: true
            });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error during forgot password' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, otp, password } = req.body;
        if (!token || !otp || !password) return res.status(400).json({ error: 'Token, OTP, and new password are required' });

        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.purpose !== 'reset') {
            return res.status(400).json({ error: 'Invalid reset token purpose' });
        }

        const match = await bcrypt.compare(otp, payload.otp);
        if (!match) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        const user = await User.findOne({ where: { email: payload.email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Hash and update password
        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Invalid or expired reset token' });
    }
};

exports.adminChangePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ message: 'User password updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating user password' });
    }
};
