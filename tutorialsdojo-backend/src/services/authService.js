const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    
    return { accessToken, refreshToken };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async register(userData) {
    const { username, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        $or: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash: password
    });
    
    const tokens = this.generateTokens(user.id);
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }
    
    const tokens = this.generateTokens(user.id);
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }
}

module.exports = new AuthService();
