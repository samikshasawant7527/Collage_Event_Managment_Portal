
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from "../components/Notification";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                { email, password }
            );

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            const role = response.data.user.role;

            if (role === "student") {
                navigate("/student");
            } else {
                navigate("/organizer");
            }

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Login failed."
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
                        <h1>Welcome Back!</h1>
                        <p>Login to continue to CampusEvents.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <Notification
                            message={message}
                            type="error"
                        />

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <div className="auth-footer">
                        <p>
                            New to CampusEvents?
                            {" "}
                            <Link to="/register">Create Account</Link>
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default Login;
