
import MyRegistrations from './pages/MyRegistrations';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateEvent from './pages/CreateEvent';
import ManageEvents from './pages/ManageEvents';
import ManageParticipants from './pages/ManageParticipants';
import EventDetails from "./pages/EventDetails";

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

import StudentPortal from './pages/StudentPortal';
import OrganizerPortal from './pages/OrganizerPortal';

import './App.css';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/events')
      .then((response) => {
        setEvents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError('Unable to load events.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">

      <nav className="navbar">
        <h2>CampusEvents</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <a href="#events">Events</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-buttons">
          <Link to="/student" className="login-btn">
            Student Portal
          </Link>

          <Link to="/organizer" className="register-btn">
            Organizer Portal
          </Link>
        </div>
      </nav>

      <section className="hero">
        <p className="tagline">YOUR CAMPUS, YOUR EVENTS</p>

        <h1>
          Discover Events.<br />
          Create Memories.
        </h1>

        <p>
          Explore college events, participate in activities,
          and stay connected with campus life.
        </p>

        <button
          className="explore-btn"
          onClick={() =>
            document.getElementById('events').scrollIntoView({
              behavior: 'smooth'
            })
          }
        >
          Explore Events
        </button>
      </section>

      <section className="events" id="events">
        <h2>Upcoming Events</h2>

        <p>Discover what's happening on your campus.</p>

        {loading && <p>Loading events...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p>No events available currently.</p>
        )}

        <div className="event-list">
          {events.map((event) => (
            <div className="event-card" key={event._id}>
              <div className="event-image">🎓</div>

              <h3>{event.title}</h3>
              <p>{event.description}</p>

              <p>
                <strong>Category:</strong> {event.category}
              </p>

              <p>
                <strong>Date:</strong>{' '}
                {new Date(event.date).toLocaleDateString('en-IN')}
              </p>

              <p>
                <strong>Venue:</strong> {event.venue}
              </p>

              <p>
                <strong>Capacity:</strong> {event.capacity}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer id="about">
        <p>
          © 2026 CampusEvents | College Event Management Portal
        </p>
      </footer>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "club"]}>
              <OrganizerPortal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-event"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "club"]}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-events"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "club"]}>
              <ManageEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-participants"
          element={
            <ProtectedRoute allowedRoles={["admin", "faculty", "club"]}>
              <ManageParticipants />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-registrations"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyRegistrations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/event/:eventId"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <EventDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
