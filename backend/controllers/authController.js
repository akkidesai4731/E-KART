const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from backend .env");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

// Public user details (never return the password)
function getPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    isActive: user.isActive,
  };
}

// REGISTER CUSTOMER
async function registerUser(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and a password of at least 8 characters are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Public registration always creates a customer.
    // Never accept the role from the request body.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      password: hashedPassword,
      role: "customer",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: getPublicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register. Please try again.",
    });
  }
}

// LOGIN CUSTOMER OR ADMIN
async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
}

// GET LOGGED-IN USER PROFILE
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User account not found or inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile.",
    });
  }
}

module.exports = {
  registerUser,
  loginCustomer,
  getMe,
};
