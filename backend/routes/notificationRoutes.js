
const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/authMiddleware");

// Get all notifications for the logged-in user
router.get("/", verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id
        })
            .populate("relatedEvent", "title date venue")
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
});

// Get unread notification count
router.get("/unread-count", verifyToken, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({
            message: "Failed to get unread notification count",
            error: error.message
        });
    }
});

// Mark one notification as read
router.put("/:notificationId/read", verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.notificationId,
                recipient: req.user.id
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update notification",
            error: error.message
        });
    }
});

// Mark all notifications as read
router.put("/read-all", verifyToken, async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.id,
                isRead: false
            },
            { isRead: true }
        );

        res.status(200).json({
            message: "All notifications marked as read"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update notifications",
            error: error.message
        });
    }
});

module.exports = router;
