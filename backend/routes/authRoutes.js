
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// STUDENT REGISTRATION
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: "student"
        });

        await newUser.save();

        res.status(201).json({
            message: "Student registered successfully."
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed.",
            error: error.message
        });
    }
});

// USER LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationName: user.organizationName
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed.",
            error: error.message
        });
    }
});

// ADMIN CREATES ORGANIZER ACCOUNTS
router.post(
    "/create-organizer",
    verifyToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const { name, email, password, role, organizationName } = req.body;

            if (!name || !email || !password || !role) {
                return res.status(400).json({
                    message: "Please fill in all required fields."
                });
            }

            if (!["admin", "faculty", "club"].includes(role)) {
                return res.status(400).json({
                    message: "Invalid organizer role."
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters."
                });
            }

            if (role === "club" && !organizationName?.trim()) {
                return res.status(400).json({
                    message: "Please enter the club name."
                });
            }

            const existingUser = await User.findOne({
                email: email.toLowerCase().trim()
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "Email is already registered."
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const organizer = new User({
                name,
                email,
                password: hashedPassword,
                role,
                organizationName
            });

            await organizer.save();

            res.status(201).json({
                message: "Organizer account created successfully."
            });

        } catch (error) {
            res.status(500).json({
                message: "Failed to create organizer account.",
                error: error.message
            });
        }
    }
);

module.exports = router;
