
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import Notification from "../components/Notification";

function ManageEvents() {
    const [events, setEvents] = useState([]);
    const [eventStats, setEventStats] = useState([]);

    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");

    const [editingId, setEditingId] = useState(null);
    const [savingChanges, setSavingChanges] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "Technology",
        date: "",
        venue: "Prayag Auditorium",
        capacity: ""
    });

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch organizer-managed events
    const fetchEvents = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/events/manage",
                { headers }
            );

            setEvents(response.data);
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to load events."
            );
            setNotificationType("error");
        } finally {
            setLoadingEvents(false);
        }
    };

    // Fetch actual participant statistics
    const fetchEventStats = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/registrations/event-stats",
                { headers }
            );

            setEventStats(response.data);
        } catch (error) {
            console.error("Unable to load event statistics:", error);
        }
    };

    // Load events and statistics
    useEffect(() => {
        fetchEvents();
        fetchEventStats();
    }, []);

    // Calculate event status
    const getEventStatus = (eventDate) => {
        const event = new Date(eventDate);
        const today = new Date();

        const eventDay = new Date(
            event.getFullYear(),
            event.getMonth(),
            event.getDate()
        );

        const todayDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        if (eventDay > todayDay) return "Upcoming";
        if (eventDay < todayDay) return "Completed";

        return "Ongoing";
    };

    // Dashboard statistics
    const totalEvents = events.length;

    const upcomingEvents = events.filter(
        (event) => getEventStatus(event.date) === "Upcoming"
    ).length;

    const completedEvents = events.filter(
        (event) => getEventStatus(event.date) === "Completed"
    ).length;

    // Get participant statistics for a particular event
    const getStats = (eventId) => {
        return eventStats.find(
            (stat) => stat.eventId === eventId
        );
    };

    // Start editing an event
    const startEditing = (event) => {
        setEditingId(event._id);

        setForm({
            title: event.title,
            description: event.description,
            category: event.category,
            date: new Date(event.date).toISOString().slice(0, 16),
            venue: event.venue,
            capacity: event.capacity
        });

        setMessage("");
    };

    // Handle form changes
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingId(null);

        setForm({
            title: "",
            description: "",
            category: "Technology",
            date: "",
            venue: "Prayag Auditorium",
            capacity: ""
        });

        setMessage("");
    };

    // Save edited event
    const saveChanges = async (e) => {
        e.preventDefault();

        if (!editingId) return;

        setSavingChanges(true);
        setMessage("");

        try {
            const response = await axios.put(
                `http://localhost:5000/api/events/${editingId}`,
                {
                    ...form,
                    capacity: Number(form.capacity)
                },
                { headers }
            );

            setMessage(
                response.data.message || "Event updated successfully!"
            );
            setNotificationType("success");

            setEditingId(null);

            await fetchEvents();
            await fetchEventStats();

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Failed to update event."
            );
            setNotificationType("error");
        } finally {
            setSavingChanges(false);
        }
    };

    // Delete event
    const deleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event?")) {
            return;
        }

        setDeletingId(eventId);
        setMessage("");

        try {
            const response = await axios.delete(
                `http://localhost:5000/api/events/${eventId}`,
                { headers }
            );

            setMessage(
                response.data.message || "Event deleted successfully!"
            );
            setNotificationType("success");

            if (editingId === eventId) {
                setEditingId(null);
            }

            await fetchEvents();
            await fetchEventStats();

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Failed to delete event."
            );
            setNotificationType("error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="portal-page">

            {/* Navbar */}
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/organizer">Dashboard</Link>
                    <LogoutButton />
                </div>
            </nav>

            <section className="events">

                <h2>Manage Events</h2>

                <p>View, edit and manage your college events.</p>

                {/* Notifications */}
                <Notification
                    message={message}
                    type={notificationType}
                />

                {/* Event Dashboard Statistics */}
                <div className="dashboard-stats">

                    <div className="stat-card">
                        <h3>{loadingEvents ? "..." : totalEvents}</h3>
                        <p>Total Events</p>
                    </div>

                    <div className="stat-card">
                        <h3>{loadingEvents ? "..." : upcomingEvents}</h3>
                        <p>Upcoming Events</p>
                    </div>

                    <div className="stat-card">
                        <h3>{loadingEvents ? "..." : completedEvents}</h3>
                        <p>Completed Events</p>
                    </div>

                </div>

                {/* Edit Event Form */}
                {editingId && (
                    <form
                        onSubmit={saveChanges}
                        style={{
                            maxWidth: "600px",
                            margin: "25px auto",
                            padding: "25px",
                            background: "white",
                            borderRadius: "12px"
                        }}
                    >
                        <h3>Edit Event</h3>

                        <label>Event Title</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />

                        <label>Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            required
                        />

                        <label>Category</label>
                        <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                        >
                            <option>Technology</option>
                            <option>Cultural</option>
                            <option>Sports</option>
                            <option>Workshop</option>
                            <option>Seminar</option>
                            <option>Other</option>
                        </select>

                        <label>Date and Time</label>
                        <input
                            type="datetime-local"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />

                        <label>Venue</label>
                        <select
                            name="venue"
                            value={form.venue}
                            onChange={handleChange}
                        >
                            <option>Prayag Auditorium</option>
                            <option>Raj Kapoor Memorial Auditorium</option>
                            <option>Urmilatai Vishwanath Karad Auditorium</option>
                            <option>World Peace Dome & Convention Center</option>
                            <option>Swami Vivekanand Mandapam</option>
                            <option>MANET Auditorium</option>
                            <option>Bioengineering Auditorium</option>
                            <option>MITCOM Seminar Hall</option>
                            <option>MITM Conference Hall</option>
                            <option>Other</option>
                        </select>

                        <label>Maximum Participants</label>
                        <input
                            type="number"
                            name="capacity"
                            value={form.capacity}
                            onChange={handleChange}
                            min="1"
                            required
                        />

                        <button
                            type="submit"
                            className="register-btn"
                            disabled={savingChanges}
                        >
                            {savingChanges
                                ? "Saving Changes..."
                                : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            className="login-btn"
                            onClick={cancelEditing}
                            disabled={savingChanges}
                        >
                            Cancel
                        </button>
                    </form>
                )}

                {/* Loading Events */}
                {loadingEvents && (
                    <p>Loading events...</p>
                )}

                {/* Event Cards */}
                {!loadingEvents && (
                    <div className="event-list">

                        {events.map((event) => {
                            const status = getEventStatus(event.date);
                            const stats = getStats(event._id);

                            const registeredCount =
                                stats?.registeredCount ?? 0;

                            const availableSeats =
                                stats?.availableSeats ?? event.capacity;

                            const percentage =
                                stats?.registrationPercentage ?? 0;

                            return (
                                <div className="event-card" key={event._id}>

                                    <div className="event-image">🎓</div>

                                    <h3>{event.title}</h3>

                                    <p>{event.description}</p>

                                    <p>
                                        <strong>Category:</strong> {event.category}
                                    </p>

                                    <p>
                                        <strong>Date:</strong>{" "}
                                        {new Date(event.date).toLocaleString("en-IN")}
                                    </p>

                                    <p>
                                        <strong>Venue:</strong> {event.venue}
                                    </p>

                                    <p>
                                        <strong>Capacity:</strong> {event.capacity}
                                    </p>

                                    <p className={`event-status ${status.toLowerCase()}`}>
                                        <strong>Status:</strong> {status}
                                    </p>

                                    {/* Participant Statistics */}
                                    <div className="participant-stats">

                                        <h4>Registration Details</h4>

                                        <p>
                                            <strong>Registered Participants:</strong>{" "}
                                            {registeredCount} / {event.capacity}
                                        </p>

                                        <p>
                                            <strong>Available Seats:</strong>{" "}
                                            {availableSeats}
                                        </p>

                                        <p>
                                            <strong>Registration:</strong>{" "}
                                            {percentage}%
                                        </p>

                                        <div className="registration-progress">
                                            <div
                                                className="registration-progress-fill"
                                                style={{
                                                    width: `${Math.min(percentage, 100)}%`
                                                }}
                                            ></div>
                                        </div>

                                    </div>

                                    {/* View Participants */}
                                    <Link
                                        to={`/manage-participants?eventId=${event._id}`}
                                        className="login-btn"
                                        style={{
                                            display: "inline-block",
                                            textDecoration: "none",
                                            textAlign: "center",
                                            marginBottom: "10px"
                                        }}
                                    >
                                        View Participants
                                    </Link>

                                    {/* Edit Event */}
                                    <button
                                        className="register-btn"
                                        onClick={() => startEditing(event)}
                                        disabled={
                                            savingChanges || deletingId !== null
                                        }
                                    >
                                        Edit Event
                                    </button>

                                    {/* Delete Event */}
                                    <button
                                        className="login-btn"
                                        onClick={() => deleteEvent(event._id)}
                                        disabled={
                                            deletingId === event._id ||
                                            savingChanges
                                        }
                                    >
                                        {deletingId === event._id
                                            ? "Deleting..."
                                            : "Delete Event"}
                                    </button>

                                </div>
                            );
                        })}

                    </div>
                )}

                {!loadingEvents && events.length === 0 && (
                    <p>No managed events found.</p>
                )}

            </section>
        </div>
    );
}

export default ManageEvents;
