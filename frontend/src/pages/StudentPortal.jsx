
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import Notification from "../components/Notification";
import NotificationBell from "../components/NotificationBell";

function StudentPortal() {
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [registrationLoading, setRegistrationLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");
    const [statsMessage, setStatsMessage] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Fetch all available events
    const fetchEvents = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/events"
            );

            setEvents(response.data);
        } catch (error) {
            setMessage("Unable to load events.");
            setNotificationType("error");
        } finally {
            setLoading(false);
        }
    };

    // Fetch logged-in student's registrations
    const fetchRegistrations = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/registrations/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRegistrations(response.data);
            setStatsMessage("");
        } catch (error) {
            setStatsMessage(
                error.response?.data?.message ||
                "Unable to load your registration statistics."
            );
        } finally {
            setRegistrationLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchRegistrations();
    }, []);

    // Register for an event
    const handleRegister = async (eventId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                `http://localhost:5000/api/registrations/${eventId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                "Registration request submitted. Waiting for organizer approval."
            );
            setNotificationType("success");

            await fetchRegistrations();
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Registration failed."
            );
            setNotificationType("error");
        }
    };

    // Get organizer information
    const getOrganizerInfo = (event) => {
        const organizer = event.createdBy;

        if (!organizer || typeof organizer !== "object") {
            return {
                type: "Organizer",
                name: "Information unavailable"
            };
        }

        switch (organizer.role) {
            case "faculty":
                return {
                    type: "Faculty / Teacher",
                    name: organizer.name || "Name unavailable"
                };

            case "club":
                return {
                    type: "Student Club",
                    name: organizer.organizationName || "Club name unavailable"
                };

            case "admin":
                return {
                    type: "Administrator",
                    name: organizer.name || "Name unavailable"
                };

            default:
                return {
                    type: "Organizer",
                    name: "Information unavailable"
                };
        }
    };

    // Get unique event categories
    const categories = [
        "All",
        ...new Set(
            events.map((event) => event.category).filter(Boolean)
        )
    ];

    // Search, filter and sort events
    const filteredEvents = events
        .filter((event) =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter((event) =>
            selectedCategory === "All" ||
            event.category === selectedCategory
        )
        .sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

    // Calculate today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only approved registrations count as confirmed participation
    const activeRegistrations = registrations.filter(
        (registration) =>
            registration.status === "approved" &&
            registration.event
    );

    const totalRegistered = activeRegistrations.length;

    // Upcoming approved events
    const upcomingRegistered = activeRegistrations.filter(
        (registration) => {
            const eventDate = new Date(registration.event.date);
            eventDate.setHours(0, 0, 0, 0);

            return eventDate >= today;
        }
    ).length;

    // Completed approved events
    const completedRegistered = activeRegistrations.filter(
        (registration) => {
            const eventDate = new Date(registration.event.date);
            eventDate.setHours(0, 0, 0, 0);

            return eventDate < today;
        }
    ).length;

    return (
        <div className="portal-page student-dashboard">

            {/* Navigation Bar */}
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/">Home</Link>

                    <Link to="/my-registrations">
                        My Registrations
                    </Link>

                    <NotificationBell />

                    <LogoutButton />
                </div>
            </nav>

            <main className="student-main">

                {/* Welcome Section */}
                <section className="student-welcome">
                    <div className="student-welcome-content">
                        <span className="student-eyebrow">
                            STUDENT DASHBOARD
                        </span>

                        <h1>
                            Discover what's happening on campus.
                        </h1>

                        <p>
                            Explore college events, take part in activities,
                            and make your campus experience memorable.
                        </p>

                        <Link
                            to="/my-registrations"
                            className="student-primary-link"
                        >
                            View My Registrations
                        </Link>
                    </div>

                    <div className="student-welcome-decoration">
                        <span>✦</span>
                        <div className="student-decoration-circle">🎓</div>
                    </div>
                </section>

                {/* Activity Statistics */}
                <section className="student-stats-section">
                    <div className="student-section-heading">
                        <div>
                            <h2>Your Activity</h2>
                            <p>A quick overview of your event participation.</p>
                        </div>
                    </div>

                    <div className="student-stats-grid">
                        <div className="student-stat-card">
                            <div className="student-stat-icon">📋</div>
                            <div>
                                <h3>
                                    {registrationLoading ? "..." : totalRegistered}
                                </h3>
                                <p>Total Registered Events</p>
                            </div>
                        </div>

                        <div className="student-stat-card">
                            <div className="student-stat-icon">📅</div>
                            <div>
                                <h3>
                                    {registrationLoading ? "..." : upcomingRegistered}
                                </h3>
                                <p>Upcoming Events</p>
                            </div>
                        </div>

                        <div className="student-stat-card">
                            <div className="student-stat-icon">✓</div>
                            <div>
                                <h3>
                                    {registrationLoading ? "..." : completedRegistered}
                                </h3>
                                <p>Completed Events</p>
                            </div>
                        </div>
                    </div>

                    {statsMessage && (
                        <p className="student-stats-message">
                            {statsMessage}
                        </p>
                    )}
                </section>

                {/* Available Events */}
                <section className="student-events-section">
                    <div className="student-section-heading">
                        <div>
                            <span className="student-eyebrow">
                                CAMPUS ACTIVITIES
                            </span>
                            <h2>Explore Upcoming Events</h2>
                            <p>
                                Find an event that interests you and be part
                                of the experience.
                            </p>
                        </div>

                        <span className="student-event-count">
                            {loading ? "Loading..." : `${filteredEvents.length} Events`}
                        </span>
                    </div>

                    <Notification
                        message={message}
                        type={notificationType}
                    />

                    {/* Search and Category Filters */}
                    {!loading && events.length > 0 && (
                        <div className="student-filter-panel">
                            <div className="student-search-box">
                                <span>⌕</span>
                                <input
                                    type="text"
                                    placeholder="Search events by name..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>

                            <div className="student-category-box">
                                <label htmlFor="student-category">
                                    Category
                                </label>

                                <select
                                    id="student-category"
                                    value={selectedCategory}
                                    onChange={(e) =>
                                        setSelectedCategory(e.target.value)
                                    }
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {category === "All"
                                                ? "All Categories"
                                                : category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="student-empty-state">
                            <div className="student-loading-icon">⏳</div>
                            <h3>Loading events...</h3>
                            <p>Please wait while we fetch campus events.</p>
                        </div>
                    )}

                    {!loading && events.length === 0 && (
                        <div className="student-empty-state">
                            <div className="student-loading-icon">📅</div>
                            <h3>No events available</h3>
                            <p>There are no events to display right now.</p>
                        </div>
                    )}

                    {!loading &&
                        filteredEvents.length === 0 &&
                        events.length > 0 && (
                            <div className="student-empty-state">
                                <div className="student-loading-icon">🔎</div>
                                <h3>No matching events found</h3>
                                <p>Try another event name or category.</p>
                            </div>
                        )}

                    {/* Event Cards */}
                    <div className="student-event-grid">
                        {filteredEvents.map((event) => {
                            const organizer = getOrganizerInfo(event);

                            return (
                                <article
                                    className="student-event-card"
                                    key={event._id}
                                >
                                    <div className="student-event-card-top">
                                        <div className="student-event-icon">
                                            🎓
                                        </div>

                                        <span className="student-event-category">
                                            {event.category || "General"}
                                        </span>
                                    </div>

                                    <div className="student-event-card-body">
                                        <h3>{event.title}</h3>

                                        <p className="student-event-description">
                                            {event.description}
                                        </p>

                                        {/* Organizer Information */}
                                        <div className="student-event-organizer">
                                            <span className="student-organizer-icon">
                                                {organizer.type === "Student Club"
                                                    ? "👥"
                                                    : organizer.type === "Faculty / Teacher"
                                                        ? "👨‍🏫"
                                                        : "🏛️"}
                                            </span>

                                            <div>
                                                <span className="student-organizer-label">
                                                    Organized by
                                                </span>

                                                <strong>
                                                    {organizer.name}
                                                </strong>

                                                <small>
                                                    {organizer.type}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="student-event-details">
                                            <div>
                                                <span>📅</span>
                                                <p>
                                                    {new Date(event.date).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric"
                                                        }
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <span>📍</span>
                                                <p>{event.venue}</p>
                                            </div>

                                            <div>
                                                <span>👥</span>
                                                <p>
                                                    Capacity: {event.capacity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="student-event-card-actions">
                                        <Link
                                            to={`/event/${event._id}`}
                                            className="student-details-btn"
                                        >
                                            View Details
                                        </Link>

                                        <button
                                            type="button"
                                            className="student-register-btn"
                                            onClick={() => handleRegister(event._id)}
                                        >
                                            Register Now
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default StudentPortal;
