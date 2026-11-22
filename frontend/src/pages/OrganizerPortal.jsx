
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import Notification from "../components/Notification";
import NotificationBell from "../components/NotificationBell";

function OrganizerPortal() {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("faculty");
    const [organizationName, setOrganizationName] = useState("");

    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");
    const [creatingAccount, setCreatingAccount] = useState(false);

    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Fetch organizer dashboard statistics
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                const [eventResponse, registrationResponse] =
                    await Promise.all([
                        axios.get(
                            "http://localhost:5000/api/events/manage",
                            { headers }
                        ),
                        axios.get(
                            "http://localhost:5000/api/registrations/organizer",
                            { headers }
                        )
                    ]);

                setEvents(eventResponse.data);
                setRegistrations(registrationResponse.data);

            } catch (error) {
                console.error(
                    "Unable to load dashboard statistics:",
                    error
                );
            } finally {
                setLoadingStats(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEvents = events.length;

    const upcomingEvents = events.filter(
        (event) => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
        }
    ).length;

    const totalParticipants = registrations.filter(
        (registration) => registration.status === "registered"
    ).length;

    // Create Faculty or Club Account
    const createOrganizer = async (e) => {
        e.preventDefault();

        setMessage("");
        setCreatingAccount(true);

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5000/api/auth/create-organizer",
                {
                    name,
                    email,
                    password,
                    role,
                    organizationName: role === "club"
                        ? organizationName
                        : ""
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message || "Account created successfully!"
            );
            setNotificationType("success");

            setName("");
            setEmail("");
            setPassword("");
            setOrganizationName("");
            setRole("faculty");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to create account."
            );
            setNotificationType("error");

        } finally {
            setCreatingAccount(false);
        }
    };

    return (
        <div className="portal-page organizer-dashboard">

            {/* Navigation */}
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/">Home</Link>
                    <NotificationBell />
                    <LogoutButton />
                </div>
            </nav>

            <main className="organizer-main">

                {/* Welcome Banner */}
                <section className="organizer-welcome">
                    <div className="organizer-welcome-content">
                        <span className="organizer-eyebrow">
                            ORGANIZER DASHBOARD
                        </span>

                        <h1>
                            Welcome, {user?.name || "Organizer"}!
                        </h1>

                        <p>
                            Manage your college events, organize activities,
                            and keep track of student participation.
                        </p>

                        <div className="organizer-role-label">
                            <span>Account Role</span>
                            <strong>
                                {user?.role?.toUpperCase() || "ORGANIZER"}
                            </strong>
                        </div>
                    </div>

                    <div className="organizer-welcome-decoration">
                        <span>✦</span>
                        <div>🏛️</div>
                    </div>
                </section>

                {/* Dashboard Statistics */}
                <section className="organizer-stats-section">
                    <div className="organizer-section-heading">
                        <div>
                            <h2>Dashboard Overview</h2>
                            <p>Summary of your event activities.</p>
                        </div>
                    </div>

                    <div className="organizer-stats-grid">
                        <div className="organizer-stat-card">
                            <div className="organizer-stat-icon">📅</div>
                            <div>
                                <h3>
                                    {loadingStats ? "..." : totalEvents}
                                </h3>
                                <p>Total Events</p>
                            </div>
                        </div>

                        <div className="organizer-stat-card">
                            <div className="organizer-stat-icon">🗓️</div>
                            <div>
                                <h3>
                                    {loadingStats ? "..." : upcomingEvents}
                                </h3>
                                <p>Upcoming Events</p>
                            </div>
                        </div>

                        <div className="organizer-stat-card">
                            <div className="organizer-stat-icon">👥</div>
                            <div>
                                <h3>
                                    {loadingStats ? "..." : totalParticipants}
                                </h3>
                                <p>Registered Participants</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Administrator Panel - Admin Only */}
                {user?.role === "admin" && (
                    <section className="organizer-admin-section">
                        <div className="organizer-section-heading">
                            <div>
                                <span className="organizer-eyebrow">
                                    ADMINISTRATION
                                </span>
                                <h2>Administrator Panel</h2>
                                <p>
                                    Create login accounts for faculty members
                                    and student clubs.
                                </p>
                            </div>

                            <div className="organizer-admin-icon">⚙️</div>
                        </div>

                        <div className="organizer-account-layout">
                            <div className="organizer-account-info">
                                <h3>Create Organizer Account</h3>
                                <p>
                                    Add a faculty member or student club to
                                    the portal. They can use their account
                                    to manage their own events.
                                </p>

                                <div className="organizer-account-note">
                                    <span>ℹ️</span>
                                    Only the administrator can create
                                    organizer accounts.
                                </div>
                            </div>

                            <form
                                className="organizer-account-form"
                                onSubmit={createOrganizer}
                            >
                                <div className="organizer-form-heading">
                                    <h3>Account Details</h3>
                                    <p>Enter the information below.</p>
                                </div>

                                <div className="organizer-form-field">
                                    <label htmlFor="organizer-name">
                                        Organizer Name
                                    </label>
                                    <input
                                        id="organizer-name"
                                        type="text"
                                        placeholder="Enter full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="organizer-form-field">
                                    <label htmlFor="organizer-email">
                                        Email Address
                                    </label>
                                    <input
                                        id="organizer-email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="organizer-form-field">
                                    <label htmlFor="organizer-password">
                                        Password
                                    </label>
                                    <input
                                        id="organizer-password"
                                        type="password"
                                        placeholder="Minimum 6 characters"
                                        minLength="6"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="organizer-form-field">
                                    <label htmlFor="organizer-role">
                                        Account Type
                                    </label>
                                    <select
                                        id="organizer-role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="faculty">
                                            Faculty / Teacher
                                        </option>
                                        <option value="club">
                                            Student Club
                                        </option>
                                    </select>
                                </div>

                                {role === "club" && (
                                    <div className="organizer-form-field">
                                        <label htmlFor="organizer-club-name">
                                            Club Name
                                        </label>
                                        <input
                                            id="organizer-club-name"
                                            type="text"
                                            placeholder="Enter student club name"
                                            value={organizationName}
                                            onChange={(e) =>
                                                setOrganizationName(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                )}

                                <Notification
                                    message={message}
                                    type={notificationType}
                                />

                                <button
                                    type="submit"
                                    className="organizer-create-btn"
                                    disabled={creatingAccount}
                                >
                                    {creatingAccount
                                        ? "Creating Account..."
                                        : "Create Account"}
                                </button>
                            </form>
                        </div>
                    </section>
                )}

                {/* Organizer Options */}
                <section className="organizer-options-section">
                    <div className="organizer-section-heading">
                        <div>
                            <span className="organizer-eyebrow">
                                EVENT MANAGEMENT
                            </span>
                            <h2>Your Organizer Panel</h2>
                            <p>
                                Choose an option to manage your campus activities.
                            </p>
                        </div>
                    </div>

                    <div className="organizer-options-grid">

                        <article className="organizer-option-card">
                            <div className="organizer-option-icon">📅</div>
                            <h3>Manage Events</h3>
                            <p>
                                View, edit, and manage the events assigned
                                to your account.
                            </p>
                            <Link
                                to="/manage-events"
                                className="organizer-option-btn"
                            >
                                View Events
                            </Link>
                        </article>

                        <article className="organizer-option-card">
                            <div className="organizer-option-icon">➕</div>
                            <h3>Create Event</h3>
                            <p>
                                Add a new college event with its date,
                                venue, category, and capacity.
                            </p>
                            <Link
                                to="/create-event"
                                className="organizer-option-btn"
                            >
                                Create Event
                            </Link>
                        </article>

                        <article className="organizer-option-card">
                            <div className="organizer-option-icon">👥</div>
                            <h3>Manage Participants</h3>
                            <p>
                                View student registrations and manage
                                participation in your events.
                            </p>
                            <Link
                                to="/manage-participants"
                                className="organizer-option-btn organizer-option-secondary"
                            >
                                View Participants
                            </Link>
                        </article>

                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="organizer-footer">
                <p>© 2026 CampusEvents | Organizer Portal</p>
            </footer>
        </div>
    );
}

export default OrganizerPortal;
