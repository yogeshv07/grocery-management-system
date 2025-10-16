const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Login
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Register
const registerUser = async (req, res) => {
  const { username, name, email, phone, address, password, role } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: "Username or Email already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      role: role || "customer" // default role
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getDeliveryUsers = async (req, res) => {
  try {
    const deliveryUsers = await User.find({ role: "delivery" }).select("-password");
    res.json(deliveryUsers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { loginUser, registerUser, getDeliveryUsers };
