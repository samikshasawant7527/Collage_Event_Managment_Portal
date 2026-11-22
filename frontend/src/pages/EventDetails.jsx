
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import Notification from "../components/Notification";

function EventDetails() {
    const { eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            setMessage("");

            try {
                const response = await axios.get(
                    "http://localhost:5000/api/events"
                );

                const selectedEvent = response.data.find(
                    (item) => item._id === eventId
                );

                if (!selectedEvent) {
                    setNotificationType("error");
                    setMessage("Event not found.");
                } else {
                    setEvent(selectedEvent);
                }
            } catch (error) {
                setNotificationType("error");
                setMessage("Unable to load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    const handleRegister = async () => {
        if (registering) return;

        setMessage("");

        try {
            setRegistering(true);

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

            setNotificationType("success");
            setMessage(response.data.message || "Registration successful!");
        } catch (error) {
            setNotificationType("error");
            setMessage(
                error.response?.data?.message || "Registration failed. Please try again."
            );
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="portal-page">
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/student">Student Portal</Link>
                    <Link to="/my-registrations">My Registrations</Link>
                    <LogoutButton />
                </div>
            </nav>

            <section className="events">
                {loading && <p>Loading event details...</p>}

                {!loading && !event && (
                    <Notification
                        message={message}
                        type={notificationType}
                    />
                )}

                {!loading && event && (
                    <div className="event-card">
                        <div className="event-image">🎓</div>

                        <h1>{event.title}</h1>

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
                            <strong>Total Capacity:</strong> {event.capacity}
                        </p>

                        <Notification
                            message={message}
                            type={notificationType}
                        />

                        <button
                            onClick={handleRegister}
                            disabled={registering}
                        >
                            {registering ? "Registering..." : "Register Now"}
                        </button>

                        <br /><br />

                        <Link to="/student" className="explore-btn">
                            Back to Events
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}

export default EventDetails;
