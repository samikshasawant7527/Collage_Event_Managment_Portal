
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../components/LogoutButton";
import Notification from "../components/Notification";

function ManageParticipants() {
    const [participants, setParticipants] = useState([]);
    const [message, setMessage] = useState("");
    const [notificationType, setNotificationType] = useState("success");

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const selectedEventId = searchParams.get("eventId") || "";

    // Fetch participants from backend
    const fetchParticipants = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/registrations/organizer",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setParticipants(response.data);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load participants."
            );
            setNotificationType("error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchParticipants();
    }, [fetchParticipants]);

    // Filter participants by selected event
    const filteredParticipants = selectedEventId
        ? participants.filter(
            (item) => item.event?._id === selectedEventId
        )
        : participants;

    // Get unique events from participant records
    const events = [
        ...new Map(
            participants
                .filter((item) => item.event)
                .map((item) => [
                    item.event._id,
                    {
                        id: item.event._id,
                        title: item.event.title
                    }
                ])
        ).values()
    ];

    // Approve or reject a student's registration
    const handleStatusChange = async (registrationId, status) => {
        const action = status === "approved" ? "approve" : "reject";

        if (status === "rejected") {
            const confirmReject = window.confirm(
                "Are you sure you want to reject this student's registration?"
            );

            if (!confirmReject) return;
        }

        try {
            setProcessingId(registrationId);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5000/api/registrations/organizer/${registrationId}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                `Registration ${action}d successfully.`
            );

            setNotificationType("success");

            await fetchParticipants();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                `Failed to ${action} registration.`
            );

            setNotificationType("error");
        } finally {
            setProcessingId(null);
        }
    };

    // Cancel a participant's registration
    const handleCancel = async (registrationId) => {
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this student's registration?"
        );

        if (!confirmCancel) return;

        try {
            setProcessingId(registrationId);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5000/api/registrations/organizer/${registrationId}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                "Registration cancelled successfully!"
            );

            setNotificationType("success");

            await fetchParticipants();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to cancel registration."
            );

            setNotificationType("error");
        } finally {
            setProcessingId(null);
        }
    };

    const selectedEvent = events.find(
        (event) => event.id === selectedEventId
    );

    // Count registration statuses
    const pendingCount = filteredParticipants.filter(
        (item) => item.status === "pending"
    ).length;

    const approvedCount = filteredParticipants.filter(
        (item) => item.status === "approved"
    ).length;

    const selectedEventHeading = selectedEvent
        ? `Participants - ${selectedEvent.title}`
        : "All Event Participants";

    return (
        <div className="portal-container">

            {/* Navigation Bar */}
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/organizer" className="login-btn">
                        Dashboard
                    </Link>

                    <LogoutButton />
                </div>
            </nav>

            {/* Main Content */}
            <div className="portal-content">

                <h1>Manage Participants</h1>

                <p>
                    View and manage students registered for your events.
                </p>

                {/* Notifications */}
                <Notification
                    message={message}
                    type={notificationType}
                />

                {/* Event Filter */}
                {!loading && (
                    <div className="participant-filter">
                        <label htmlFor="eventFilter">
                            Select Event:
                        </label>

                        <select
                            id="eventFilter"
                            value={selectedEventId}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setSearchParams({
                                        eventId: e.target.value
                                    });
                                } else {
                                    setSearchParams({});
                                }
                            }}
                        >
                            <option value="">All Events</option>

                            {events.map((event) => (
                                <option
                                    key={event.id}
                                    value={event.id}
                                >
                                    {event.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Selected Event Heading */}
                {!loading && filteredParticipants.length > 0 && (
                    <h2 className="selected-event-heading">
                        {selectedEventHeading}
                    </h2>
                )}

                {/* Loading */}
                {loading && (
                    <p>Loading participants...</p>
                )}

                {/* Participant Count */}
                {!loading && (
                    <>
                        <p className="participant-count">
                            Total Requests: {filteredParticipants.length}
                        </p>

                        <div className="participant-status-summary">
                            <span>
                                Pending: <strong>{pendingCount}</strong>
                            </span>

                            <span>
                                Approved: <strong>{approvedCount}</strong>
                            </span>
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && filteredParticipants.length === 0 && (
                    <p>No participants found for this event.</p>
                )}

                {/* Participants Table */}
                {!loading && filteredParticipants.length > 0 && (
                    <div className="participants-table">

                        <table>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Email</th>
                                    <th>Event</th>
                                    <th>Registration Date</th>
                                    <th>Event Date</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredParticipants.map((item) => (
                                    <tr key={item._id}>

                                        <td>
                                            {item.student?.name || "N/A"}
                                        </td>

                                        <td>
                                            {item.student?.email || "N/A"}
                                        </td>

                                        <td>
                                            {item.event?.title || "N/A"}
                                        </td>

                                        <td>
                                            {item.createdAt
                                                ? new Date(
                                                    item.createdAt
                                                ).toLocaleDateString("en-IN")
                                                : "N/A"}
                                        </td>

                                        <td>
                                            {item.event?.date
                                                ? new Date(
                                                    item.event.date
                                                ).toLocaleDateString("en-IN")
                                                : "N/A"}
                                        </td>

                                        <td>
                                            {item.event?.venue || "N/A"}
                                        </td>

                                        <td>
                                            <span
                                                className={`registration-status registration-${item.status}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>

                                        <td>
                                            {item.status === "pending" ? (
                                                <div className="participant-action-buttons">
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                item._id,
                                                                "approved"
                                                            )
                                                        }
                                                        disabled={
                                                            processingId === item._id
                                                        }
                                                    >
                                                        {processingId === item._id
                                                            ? "Please wait..."
                                                            : "Approve"}
                                                    </button>

                                                    <button
                                                        className="reject-btn"
                                                        onClick={() =>
                                                            handleStatusChange(
                                                                item._id,
                                                                "rejected"
                                                            )
                                                        }
                                                        disabled={
                                                            processingId === item._id
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : item.status === "approved" ? (
                                                <button
                                                    className="login-btn"
                                                    onClick={() =>
                                                        handleCancel(item._id)
                                                    }
                                                    disabled={
                                                        processingId === item._id
                                                    }
                                                >
                                                    {processingId === item._id
                                                        ? "Please wait..."
                                                        : "Cancel"}
                                                </button>
                                            ) : (
                                                <span>
                                                    {item.status === "rejected"
                                                        ? "Rejected"
                                                        : "Cancelled"}
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                )}

            </div>
        </div>
    );
}

export default ManageParticipants;
