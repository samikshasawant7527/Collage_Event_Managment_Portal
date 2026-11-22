
import { useNavigate } from "react-router-dom";

function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    };

    return (
        <button className="login-btn" onClick={handleLogout}>
            Logout
        </button>
    );
}

export default LogoutButton;
