
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import Notification from "../components/Notification";

function MyRegistrations() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");

    const [cancellingId, setCancellingId] = useState(null);

    const fetchRegistrations = useCallback(async () => {
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
            setError("");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load your registrations."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    // Cancel student's own registration
    const handleCancel = async (registrationId) => {
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this registration?"
        );

        if (!confirmCancel) return;

        try {
            setCancellingId(registrationId);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5000/api/registrations/my/${registrationId}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                "Your registration has been cancelled successfully!"
            );

            setNotificationType("success");

            await fetchRegistrations();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to cancel registration."
            );

            setNotificationType("error");
        } finally {
            setCancellingId(null);
        }
    };

    // Registration statistics
    const pendingCount = registrations.filter(
        (registration) => registration.status === "pending"
    ).length;

    const approvedCount = registrations.filter(
        (registration) => registration.status === "approved"
    ).length;

    const rejectedCount = registrations.filter(
        (registration) => registration.status === "rejected"
    ).length;

    const cancelledCount = registrations.filter(
        (registration) => registration.status === "cancelled"
    ).length;

    // Status labels
    const getStatusLabel = (status) => {
        const labels = {
            pending: "Pending Approval",
            approved: "Approved",
            rejected: "Rejected",
            cancelled: "Cancelled"
        };

        return labels[status] || status;
    };

    return (
        <div className="portal-page my-registration-page">

            {/* Navigation */}
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/student" className="explore-btn">
                        Browse Events
                    </Link>

                    <LogoutButton />
                </div>
            </nav>

            <main className="my-registration-main">

                {/* Page Heading */}
                <section className="registration-welcome">
                    <div>
                        <span className="student-eyebrow">
                            YOUR CAMPUS JOURNEY
                        </span>

                        <h1>My Registrations</h1>

                        <p>
                            Keep track of your event requests and
                            confirmed participation.
                        </p>
                    </div>

                    <div className="registration-heading-icon">
                        🎫
                    </div>
                </section>

                {/* Registration Statistics */}
                {!loading && !error && (
                    <section className="registration-summary">

                        <div className="registration-summary-card">
                            <span className="registration-summary-icon">📋</span>
                            <div>
                                <h3>{registrations.length}</h3>
                                <p>Total Registrations</p>
                            </div>
                        </div>

                        <div className="registration-summary-card">
                            <span className="registration-summary-icon">⏳</span>
                            <div>
                                <h3>{pendingCount}</h3>
                                <p>Pending Approval</p>
                            </div>
                        </div>

                        <div className="registration-summary-card">
                            <span className="registration-summary-icon">✓</span>
                            <div>
                                <h3>{approvedCount}</h3>
                                <p>Approved</p>
                            </div>
                        </div>

                        <div className="registration-summary-card">
                            <span className="registration-summary-icon">✕</span>
                            <div>
                                <h3>{rejectedCount}</h3>
                                <p>Rejected</p>
                            </div>
                        </div>

                        <div className="registration-summary-card">
                            <span className="registration-summary-icon">↶</span>
                            <div>
                                <h3>{cancelledCount}</h3>
                                <p>Cancelled</p>
                            </div>
                        </div>

                    </section>
                )}

                {/* Notifications */}
                <Notification
                    message={message}
                    type={notificationType}
                />

                {!loading && error && (
                    <Notification
                        message={error}
                        type="error"
                    />
                )}

                {/* Loading */}
                {loading && (
                    <div className="registration-empty-state">
                        <div className="registration-empty-icon">⏳</div>
                        <h3>Loading your registrations...</h3>
                        <p>Please wait while we fetch your event details.</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && registrations.length === 0 && (
                    <div className="registration-empty-state">
                        <div className="registration-empty-icon">🎫</div>

                        <h3>No Registrations Yet</h3>

                        <p>
                            You haven't registered for any events yet.
                            Explore campus activities and find something
                            interesting to participate in.
                        </p>

                        <Link
                            to="/student"
                            className="registration-browse-btn"
                        >
                            Explore Events
                        </Link>
                    </div>
                )}

                {/* Registration List */}
                {!loading && !error && registrations.length > 0 && (
                    <section className="registration-list-section">

                        <div className="registration-list-heading">
                            <div>
                                <h2>Your Event Registrations</h2>
                                <p>
                                    Track your requests and event confirmations.
                                </p>
                            </div>

                            <span>
                                {registrations.length} Records
                            </span>
                        </div>

                        <div className="registration-card-list">

                            {registrations.map((registration) => (
                                <article
                                    className="registration-item-card"
                                    key={registration._id}
                                >
                                    <div className="registration-item-icon">
                                        🎓
                                    </div>

                                    <div className="registration-item-content">

                                        {registration.event ? (
                                            <>
                                                <div className="registration-item-title-row">
                                                    <h3>
                                                        {registration.event.title}
                                                    </h3>

                                                    <span
                                                        className={`registration-status-pill registration-${registration.status}`}
                                                    >
                                                        {getStatusLabel(
                                                            registration.status
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="registration-item-description">
                                                    {registration.event.description}
                                                </p>

                                                <div className="registration-item-details">
                                                    <span>
                                                        📅{" "}
                                                        {new Date(
                                                            registration.event.date
                                                        ).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>

                                                    <span>
                                                        📍 {registration.event.venue}
                                                    </span>

                                                    <span>
                                                        🏷️ {registration.event.category}
                                                    </span>
                                                </div>

                                                {/* Approval Message */}
                                                {registration.status === "pending" && (
                                                    <p className="registration-status-message">
                                                        Your request has been submitted.
                                                        Waiting for organizer approval.
                                                    </p>
                                                )}

                                                {registration.status === "approved" && (
                                                    <p className="registration-status-message approved-message">
                                                        Your registration is confirmed!
                                                        Get ready for the event.
                                                    </p>
                                                )}

                                                {registration.status === "rejected" && (
                                                    <p className="registration-status-message rejected-message">
                                                        Your registration was not approved.
                                                        You can try registering again if seats are available.
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p>Event details are unavailable.</p>
                                        )}

                                    </div>

                                    {(registration.status === "pending" ||
                                        registration.status === "approved") && (
                                            <div className="registration-item-action">
                                                <button
                                                    type="button"
                                                    className="registration-cancel-btn"
                                                    onClick={() =>
                                                        handleCancel(registration._id)
                                                    }
                                                    disabled={
                                                        cancellingId === registration._id
                                                    }
                                                >
                                                    {cancellingId === registration._id
                                                        ? "Cancelling..."
                                                        : "Cancel Registration"}
                                                </button>
                                            </div>
                                        )}

                                </article>
                            ))}

                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}

export default MyRegistrations;
