import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sidebarConfig } from '../../config/navigation';
import authService from '../../api/services/auth.service';
import { FiLogOut, FiX } from "react-icons/fi";

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

/**
 * Sidebar component
 * Single sidebar used by both doctor and assistant layouts
 * Reads user role from AuthContext -> picks correct nav items automatically
 */
const Sidebar = ({ isMobileOpen = false, onMobileClose }: SidebarProps) => {

    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    // Close mobile sidebar on route change
    useEffect(() => {
        if (isMobileOpen && onMobileClose) {
            onMobileClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    if (!user) return null;

    //  Get nav items for current users role;
    const navItems = sidebarConfig[user.role];

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            // Even if backend call fails, clear local state
        } finally {
            logout();
            navigate("/auth/login", { replace: true })
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={onMobileClose}
                />
            )}

            <aside className={`
                fixed md:sticky top-0 left-0 z-50
                w-72 flex flex-col shrink-0 h-screen bg-neutral-800
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Mobile close button */}
                <div className="md:hidden absolute top-4 right-4">
                    <button 
                        onClick={onMobileClose}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/**--- LOGO ---*/}
                <div className='px-5 py-6 border-b border-white/10'>
                    <h2 className='text-4xl font-BabesNeue text-primary tracking-wider '>
                        Dispensary
                    </h2>
                    <p className='text-gray-300'>Management System</p>
                </div>

            {/**--- Nav Links ---*/}
            <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto'>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <button
                            onClick={() => navigate(item.path)}
                            className={` flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                                        ${isActive
                                    ? "bg-primary/15 text-primary font-bold tracking-wide border-l-2 border-primary"
                                    : "text-gray-400 hover:text-white hover:bg-white/5 "
                                }
                            `}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </nav>


            {/**--- Logout --- */}
            <div className='px-3 py-2.5 my-6'>

                <button
                    onClick={handleLogout}
                    className='w-full flex items-center px-1 py-1 rounded-lg cursor-pointer text-red-500 justify-center hover:bg-red-500/10'
                >
                    <FiLogOut size={20} />
                    Logout
                </button>
            </div>

            </aside>
        </>
    )
}

export default Sidebar