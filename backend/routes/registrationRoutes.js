
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Notification = require("../models/Notification");

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Helper function to create notifications
// Notification failure should not interrupt registration operations.
const createNotification = async (recipient, title, message, type, eventId, registrationId) => {
    try {
        if (!recipient) return;

        await Notification.create({
            recipient,
            title,
            message,
            type,
            relatedEvent: eventId || null,
            relatedRegistration: registrationId || null
        });
    } catch (error) {
        console.error("Notification creation failed:", error.message);
    }
};

// STUDENT REGISTERS OR RE-REGISTERS FOR AN EVENT
router.post("/:eventId", verifyToken, authorizeRoles("student"), async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const existingRegistration = await Registration.findOne({
            student: req.user.id,
            event: eventId
        });

        if (
            existingRegistration &&
            ["pending", "approved"].includes(existingRegistration.status)
        ) {
            return res.status(409).json({
                message: existingRegistration.status === "pending"
                    ? "Your registration is already waiting for organizer approval."
                    : "You are already approved for this event."
            });
        }

        const reservedCount = await Registration.countDocuments({
            event: eventId,
            status: { $in: ["pending", "approved"] }
        });

        if (reservedCount >= event.capacity) {
            return res.status(400).json({
                message: "Sorry, this event is full."
            });
        }

        // Reapply after rejection or cancellation
        if (existingRegistration) {
            existingRegistration.status = "pending";
            await existingRegistration.save();

            await createNotification(
                req.user.id,
                "Registration Request Submitted",
                `Your request to join "${event.title}" has been submitted again.`,
                "registration",
                event._id,
                existingRegistration._id
            );

            await createNotification(
                event.createdBy,
                "New Registration Request",
                `A student has submitted a registration request for "${event.title}".`,
                "registration",
                event._id,
                existingRegistration._id
            );

            return res.status(200).json({
                message: "Your registration request has been submitted again. Waiting for organizer approval.",
                registration: existingRegistration
            });
        }

        const registration = new Registration({
            student: req.user.id,
            event: eventId,
            status: "pending"
        });

        await registration.save();

        // Notify the student
        await createNotification(
            req.user.id,
            "Registration Request Submitted",
            `Your request to join "${event.title}" has been submitted. Wait for organizer approval!`,
            "registration",
            event._id,
            registration._id
        );

        // Notify the event organizer
        await createNotification(
            event.createdBy,
            "New Registration Request",
            `A student has requested to join "${event.title}". Review the request in Manage Participants.`,
            "registration",
            event._id,
            registration._id
        );

        res.status(201).json({
            message: "Registration request submitted! Please wait for organizer approval.",
            registration
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already registered for this event."
            });
        }

        res.status(500).json({
            message: "Registration failed.",
            error: error.message
        });
    }
});

// VIEW MY REGISTRATIONS
router.get("/my", verifyToken, authorizeRoles("student"), async (req, res) => {
    try {
        const registrations = await Registration.find({
            student: req.user.id
        })
            .populate("event")
            .sort({ createdAt: -1 });

        res.status(200).json(registrations);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch registrations."
        });
    }
});

// GET PARTICIPANTS FOR ORGANIZER-MANAGED EVENTS
router.get(
    "/organizer",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            let eventFilter = {};

            if (req.user.role !== "admin") {
                const events = await Event.find({
                    createdBy: req.user.id
                }).select("_id");

                const eventIds = events.map((event) => event._id);

                eventFilter = { event: { $in: eventIds } };
            }

            const registrations = await Registration.find(eventFilter)
                .populate("student", "name email")
                .populate("event", "title date venue")
                .sort({ createdAt: -1 });

            res.status(200).json(registrations);

        } catch (error) {
            res.status(500).json({
                message: "Failed to fetch participants.",
                error: error.message
            });
        }
    }
);

// GET PARTICIPANT STATISTICS FOR EACH ORGANIZER EVENT
router.get(
    "/event-stats",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            let eventFilter = {};

            if (req.user.role !== "admin") {
                eventFilter.createdBy = req.user.id;
            }

            const events = await Event.find(eventFilter).select(
                "title capacity date venue"
            );

            const eventStats = await Promise.all(
                events.map(async (event) => {
                    const approvedCount = await Registration.countDocuments({
                        event: event._id,
                        status: "approved"
                    });

                    const pendingCount = await Registration.countDocuments({
                        event: event._id,
                        status: "pending"
                    });

                    const availableSeats = Math.max(
                        event.capacity - approvedCount - pendingCount,
                        0
                    );

                    const registrationPercentage =
                        event.capacity > 0
                            ? Math.round(
                                ((approvedCount + pendingCount) / event.capacity) * 100
                            )
                            : 0;

                    return {
                        eventId: event._id,
                        title: event.title,
                        capacity: event.capacity,
                        registeredCount: approvedCount,
                        approvedCount,
                        pendingCount,
                        availableSeats,
                        registrationPercentage,
                        date: event.date,
                        venue: event.venue
                    };
                })
            );

            res.status(200).json(eventStats);

        } catch (error) {
            res.status(500).json({
                message: "Failed to fetch event statistics.",
                error: error.message
            });
        }
    }
);

// ORGANIZER APPROVES OR REJECTS A REGISTRATION
router.put(
    "/organizer/:registrationId/status",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            const { status } = req.body;

            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({
                    message: "Invalid status. Choose approved or rejected."
                });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.registrationId)) {
                return res.status(400).json({
                    message: "Invalid registration ID."
                });
            }

            const registration = await Registration.findById(
                req.params.registrationId
            ).populate("event");

            if (!registration) {
                return res.status(404).json({
                    message: "Registration not found."
                });
            }

            if (
                req.user.role !== "admin" &&
                (
                    !registration.event ||
                    String(registration.event.createdBy) !== req.user.id
                )
            ) {
                return res.status(403).json({
                    message: "You cannot manage this registration."
                });
            }

            if (registration.status !== "pending") {
                return res.status(400).json({
                    message: "Only pending registrations can be approved or rejected."
                });
            }

            registration.status = status;
            await registration.save();

            const eventTitle = registration.event?.title || "your event";

            if (status === "approved") {
                await createNotification(
                    registration.student,
                    "Registration Approved!",
                    `Great news! Your registration for "${eventTitle}" has been approved. See you at the event!`,
                    "approval",
                    registration.event?._id,
                    registration._id
                );
            } else {
                await createNotification(
                    registration.student,
                    "Registration Update",
                    `Your registration request for "${eventTitle}" was not approved.`,
                    "rejection",
                    registration.event?._id,
                    registration._id
                );
            }

            res.status(200).json({
                message: status === "approved"
                    ? "Student registration approved successfully."
                    : "Student registration rejected successfully.",
                registration
            });

        } catch (error) {
            res.status(500).json({
                message: "Failed to update registration status.",
                error: error.message
            });
        }
    }
);

// ORGANIZER CANCELS A PARTICIPANT'S REGISTRATION
router.put(
    "/organizer/:registrationId/cancel",
    verifyToken,
    authorizeRoles("admin", "faculty", "club"),
    async (req, res) => {
        try {
            const registration = await Registration.findById(
                req.params.registrationId
            ).populate("event");

            if (!registration) {
                return res.status(404).json({
                    message: "Registration not found."
                });
            }

            if (
                req.user.role !== "admin" &&
                (
                    !registration.event ||
                    String(registration.event.createdBy) !== req.user.id
                )
            ) {
                return res.status(403).json({
                    message: "You cannot cancel this registration."
                });
            }

            if (registration.status === "cancelled") {
                return res.status(400).json({
                    message: "This registration is already cancelled."
                });
            }

            registration.status = "cancelled";
            await registration.save();

            await createNotification(
                registration.student,
                "Registration Cancelled",
                `Your registration for "${registration.event?.title || "the event"}" has been cancelled by the organizer.`,
                "event",
                registration.event?._id,
                registration._id
            );

            res.status(200).json({
                message: "Registration cancelled successfully."
            });

        } catch (error) {
            res.status(500).json({
                message: "Failed to cancel registration.",
                error: error.message
            });
        }
    }
);

// STUDENT CANCELS THEIR OWN REGISTRATION
router.put(
    "/my/:registrationId/cancel",
    verifyToken,
    authorizeRoles("student"),
    async (req, res) => {
        try {
            const registration = await Registration.findOne({
                _id: req.params.registrationId,
                student: req.user.id
            }).populate("event");

            if (!registration) {
                return res.status(404).json({
                    message: "Registration not found."
                });
            }

            if (registration.status === "cancelled") {
                return res.status(400).json({
                    message: "This registration is already cancelled."
                });
            }

            registration.status = "cancelled";
            await registration.save();

            const eventTitle = registration.event?.title || "the event";

            await createNotification(
                req.user.id,
                "Registration Cancelled",
                `Your registration for "${eventTitle}" has been cancelled successfully.`,
                "event",
                registration.event?._id,
                registration._id
            );

            await createNotification(
                registration.event?.createdBy,
                "Student Registration Cancelled",
                `A student has cancelled their registration for "${eventTitle}".`,
                "event",
                registration.event?._id,
                registration._id
            );

            res.status(200).json({
                message: "Your registration has been cancelled successfully!"
            });

        } catch (error) {
            res.status(500).json({
                message: "Failed to cancel registration.",
                error: error.message
            });
        }
    }
);

module.exports = router;
