
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from "../components/Notification";

function getCurrentDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
}

function CreateEvent() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "Technology",
        date: "",
        venue: "Prayag Auditorium",
        capacity: ""
    });

    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");
    const [creating, setCreating] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");

        if (!form.title.trim() || !form.description.trim()) {
            setNotificationType("error");
            setMessage("Please enter the event title and description.");
            return;
        }

        if (!form.date || new Date(form.date) <= new Date()) {
            setNotificationType("error");
            setMessage("Please select a future date and time.");
            return;
        }

        const capacity = Number(form.capacity);

        if (!Number.isInteger(capacity) || capacity < 1) {
            setNotificationType("error");
            setMessage("Please enter a valid participant capacity.");
            return;
        }

        try {
            setCreating(true);

            const token = localStorage.getItem("token");

            await axios.post(
                "http://localhost:5000/api/events",
                {
                    ...form,
                    title: form.title.trim(),
                    description: form.description.trim(),
                    capacity
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotificationType("success");
            setMessage("Event created successfully!");

            setTimeout(() => {
                navigate("/organizer");
            }, 1200);

        } catch (error) {
            setNotificationType("error");
            setMessage(
                error.response?.data?.message ||
                "Failed to create event. Please try again."
            );
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="portal-page">
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/organizer">Dashboard</Link>
                    <Link to="/">Home</Link>
                </div>
            </nav>

            <section className="events">
                <h2>Create New Event</h2>
                <p>Enter the details of your college event.</p>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        maxWidth: "600px",
                        margin: "25px auto",
                        padding: "25px",
                        background: "white",
                        borderRadius: "12px",
                        boxShadow: "0 2px 12px #ddd"
                    }}
                >
                    <label>Event Title</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                        maxLength="100"
                        placeholder="Enter event title"
                    />

                    <label>Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        required
                        maxLength="2000"
                        placeholder="Describe your event"
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
                        min={getCurrentDateTime()}
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
                        step="1"
                        required
                        placeholder="Enter participant capacity"
                    />

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={creating}
                    >
                        {creating ? "Creating Event..." : "Create Event"}
                    </button>

                    <Notification
                        message={message}
                        type={notificationType}
                    />
                </form>
            </section>
        </div>
    );
}

export default CreateEvent;
