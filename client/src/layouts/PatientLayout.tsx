import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sidebarConfig } from "../config/navigation";
import authService from "../api/services/auth.service";
import { FiLogOut } from "react-icons/fi";

interface PatientLayoutProps {
    children: ReactNode
}

/**
 * PatientLayout
 * Mobile-first layout for all patient pages
 * Structure:
 *      - Top navbar (dispensary name + logout)
 *      - Scrollable page content
 *      - Bottom navigation bar (Dashboard, Appointments, Prescriptions, Symptom Check)
 * 
 * No Sidebar - most patient use mobile browsers
 */
const PatientLayout = ({ children }: PatientLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    if (!user) return null;

    const navItems = sidebarConfig["patient"];

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
        <div>

            {/* --- TOP NAVBAR --- */}
            <header>

                <div>
                    <h1>
                        <span>Medical Center</span>
                    </h1>
                </div>

                <div>
                    <div>
                        <div>
                            {user.name.charAt(0).toUpperCase()}
                        </div>

                        <span>
                            {user.name}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                    >
                        <FiLogOut size={20} />
                        Logout
                    </button>
                </div>
            </header>

            {/* --- PAGE CONTENT --- */}
            <main>
                <div>
                    {children}
                </div>
            </main>

            {/* --- Bottom Navigation --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-warning border-t border-gray-border 
                            flex items-center justify-around px-2 py-2 z-10 "
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                ${isActive ? "text-primary" : "text-gray-text hover:text-primary"}
                            `}
                        >
                            <Icon size={20} />
                            <span>
                                {item.label}
                            </span>
                        </button>
                    );
                })};

            </nav>
        </div>
    )
};

export default PatientLayout;
