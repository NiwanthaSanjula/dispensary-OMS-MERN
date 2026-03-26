import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FaHeartbeat } from "react-icons/fa";

interface AuthLayoutProps {
    children: ReactNode;
}

/**
 * AuthLayout
 * Shared layout for login and register pages.
 * Includes a clean, simple top navbar to navigate back.
 */
const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen bg-gray-bg flex flex-col">
            {/* Minimal Auth Navbar */}
            <nav className="w-full bg-white/90 backdrop-blur-md shadow-sm py-4 z-50 sticky top-0">
                <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
                    
                    {/* Logo (same as landing page) */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-primary text-white p-2 rounded-lg group-hover:bg-primary-dark transition">
                            <FaHeartbeat size={20} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight transition-colors text-dark">
                            Medical<span className="text-primary">Center</span>
                        </span>
                    </Link>

                    {/* Back to Home Link */}
                    <Link 
                        to="/" 
                        className="text-sm font-medium text-gray-text hover:text-primary transition flex items-center gap-1"
                    >
                        &larr; <span className="hidden sm:inline">Back to Home</span>
                    </Link>
                </div>
            </nav>

            {/* Main Center Content Area */}
            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
        </div>
    );
};

export default AuthLayout;
