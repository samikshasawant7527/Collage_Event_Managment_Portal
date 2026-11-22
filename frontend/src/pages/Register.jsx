
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from "../components/Notification";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [messageType, setMessageType] = useState("error");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                formData
            );

            setMessageType("success");
            setMessage(response.data.message || "Account created successfully!");

            setTimeout(() => {
                navigate("/login");
            }, 1200);

        } catch (error) {
            setMessageType("error");
            setMessage(
                error.response?.data?.message || "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="portal-page">
            <nav className="navbar">
                <h2>CampusEvents</h2>

                <div className="nav-buttons">
                    <Link to="/" className="login-btn">Home</Link>
                </div>
            </nav>

            <main className="auth-page">
                <div className="auth-card">

                    <div className="auth-heading">
                        <div className="auth-icon">🎓</div>
                        <h1>Create Student Account</h1>
                        <p>Join CampusEvents and participate in college activities.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label htmlFor="register-name">Full Name</label>
                            <input
                                id="register-name"
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-email">Email Address</label>
                            <input
                                id="register-email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-password">Password</label>
                            <input
                                id="register-password"
                                type="password"
                                name="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={handleChange}
                                minLength="6"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <Notification
                            message={message}
                            type={messageType}
                        />

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>

                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?
                            {" "}
                            <Link to="/login">Login here</Link>
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Register;
