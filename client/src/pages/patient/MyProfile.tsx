
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../../api/services/auth.service';
import { FiLogOut } from 'react-icons/fi';

const MyProfile = () => {

    const navigate = useNavigate()
    const { user, logout } = useAuth();

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await authService.logout

        } catch (error) {
            // clear frontend state regardless
        } finally {
            logout();
            navigate("/auth/login", { replace: true });
        }
    }

    return (
        <div>MyProfile

            <button
                onClick={handleLogout}
                className="btn-danger flex items-center gap-2 text-xs px-2 py-1.5"
            >
                <FiLogOut size={15} />
                Logout
            </button>
        </div>
    )
}

export default MyProfile