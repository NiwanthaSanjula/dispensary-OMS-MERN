import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sidebarConfig } from "../config/navigation";

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
    const { user } = useAuth();

    if (!user) return null;

    const navItems = sidebarConfig["patient"];

    return (
        <div className="px-6 py-4">

            {/* --- TOP NAVBAR --- */}
            <header className="flex items-center justify-between border-b border-gray-border pb-4 mb-4">

                <div>
                    <h1 className="font-BabesNeue text-xl text-primary flex items-center gap-1">
                        Medical
                        <span className="text-dark">Center</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                        {user.name}
                    </span>
                    <div className="w-6 h-6 text-xs rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* --- PAGE CONTENT --- */}
            <main>
                <div>
                    {children}
                </div>
            </main>

            {/* --- Bottom Navigation --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-bg border-t border-gray-border shadow-lg 
                            flex items-center justify-around px-2 py-2 z-10 "
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1
                                ${isActive ? "text-primary font-semibold" : "text-gray-text hover:text-primary"}
                            `}
                        >
                            <Icon size={20} />
                            <span className="text-xs">
                                {item.label}
                            </span>
                        </button>
                    );
                })}

            </nav>
        </div>
    )
};

export default PatientLayout;
