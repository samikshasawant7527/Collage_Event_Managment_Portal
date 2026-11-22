
const express = require("express");
const router = express.Router();

const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// View all public events
router.get("/", async (req, res) => {
    try {
        const events = await Event.find()
            .populate("createdBy", "name role organizationName")
            .sort({ date: 1 });

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch events." });
    }
});

// View events managed by the logged-in organizer
router.get(
    "/manage",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            const filter = req.user.role === "admin"
                ? {}
                : { createdBy: req.user.id };

            const events = await Event.find(filter)
                .populate("createdBy", "name role organizationName")
                .sort({ date: 1 });

            res.status(200).json(events);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch managed events." });
        }
    }
);

// Create event
router.post(
    "/",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            const { title, description, category, date, venue, capacity } = req.body;

            const newEvent = new Event({
                title,
                description,
                category,
                date,
                venue,
                capacity,
                createdBy: req.user.id
            });

            const savedEvent = await newEvent.save();

            res.status(201).json({
                message: "Event created successfully!",
                event: savedEvent
            });
        } catch (error) {
            res.status(400).json({
                message: "Failed to create event.",
                error: error.message
            });
        }
    }
);

// Edit event
router.put(
    "/:eventId",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            const event = await Event.findById(req.params.eventId);

            if (!event) {
                return res.status(404).json({ message: "Event not found." });
            }

            if (
                req.user.role !== "admin" &&
                String(event.createdBy) !== req.user.id
            ) {
                return res.status(403).json({ message: "You cannot edit this event." });
            }

            const fields = ["title", "description", "category", "date", "venue", "capacity"];

            fields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    event[field] = req.body[field];
                }
            });

            await event.save();

            res.status(200).json({
                message: "Event updated successfully!",
                event
            });
        } catch (error) {
            res.status(400).json({ message: "Failed to update event." });
        }
    }
);

// Delete event
router.delete(
    "/:eventId",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            const event = await Event.findById(req.params.eventId);

            if (!event) {
                return res.status(404).json({ message: "Event not found." });
            }

            if (
                req.user.role !== "admin" &&
                String(event.createdBy) !== req.user.id
            ) {
                return res.status(403).json({ message: "You cannot delete this event." });
            }

            await Registration.deleteMany({ event: event._id });
            await event.deleteOne();

            res.status(200).json({ message: "Event deleted successfully!" });
        } catch (error) {
            res.status(500).json({ message: "Failed to delete event." });
        }
    }
);

module.exports = router;
