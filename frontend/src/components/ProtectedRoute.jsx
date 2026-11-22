
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {

    const token = localStorage.getItem("token");

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
        console.error("Invalid user information:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    }

    // Check whether the user is logged in
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check whether the user's role is allowed
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    // Allow access
    return children;
}

export default ProtectedRoute;
