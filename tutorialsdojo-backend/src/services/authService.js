const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');

class AuthService {
  static generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  static verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
  }

  static async register(userData) {
    const { username, email, password, firstName, lastName } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        $or: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    return {
      user,
      token
    };
  }

  static async login(credentials) {
    const { email, password } = credentials;
    
    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    return {
      user,
      token
    };
  }

  static async getUserFromToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async refreshToken(token) {
    const user = await this.getUserFromToken(token);
    
    const newToken = this.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    return {
      user,
      token: newToken
    };
  }
}

module.exports = AuthService;