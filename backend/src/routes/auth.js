const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const fs = require("fs/promises");
const path = require("path");
const User = require("../models/User");

const router = express.Router();

const usersFilePath = path.join(__dirname, "../../data/local_users.json");
let memoryUsers = [];
let initialized = false;

function usingMongo() {
  return mongoose.connection.readyState === 1;
}

async function listUsers() {
  if (usingMongo()) {
    return User.find().lean();
  }
  if (!initialized) {
    await ensureLocalUsersLoaded();
  }
  return memoryUsers;
}

async function ensureLocalUsersLoaded() {
  initialized = true;
  try {
    const raw = await fs.readFile(usersFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    memoryUsers = Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    memoryUsers = [];
  }
}

async function persistLocalUsers() {
  try {
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    await fs.writeFile(usersFilePath, JSON.stringify(memoryUsers, null, 2), "utf-8");
  } catch (_error) {
    // Intentionally swallow local persistence errors so auth still works in-memory.
  }
}

router.post("/register", async (req, res) => {
  const { name, email, password, role, department = null } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const users = await listUsers();
  const exists = users.some((u) => String(u.email).toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ message: "Email already exists" });

  const allowedRoles = ["operator", "department_officer"];
  const firstUser = users.length === 0;
  const safeRole = firstUser ? "admin" : allowedRoles.includes(role) ? role : "operator";
  const passwordHash = await bcrypt.hash(password, 10);

  let created;
  if (usingMongo()) {
    created = await User.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role: safeRole,
      department: safeRole === "department_officer" ? department : null,
    });
  } else {
    created = {
      _id: `u-${Date.now()}`,
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      role: safeRole,
      department: safeRole === "department_officer" ? department : null,
    };
    memoryUsers.push(created);
    await persistLocalUsers();
  }

  res.status(201).json({
    message: "Account created",
    user: {
      id: String(created._id),
      name: created.name,
      email: created.email,
      role: created.role,
      department: created.department,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const users = await listUsers();
  const user = users.find((u) => String(u.email).toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: String(user._id), name: user.name, email: user.email, role: user.role, department: user.department },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );
  return res.json({
    token,
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role, department: user.department },
  });
});

module.exports = router;
