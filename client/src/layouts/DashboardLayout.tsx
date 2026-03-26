import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "../components/layouts/Sidebar";
import { FiMenu } from "react-icons/fi";

interface DashboardLayoutProps {
    children: ReactNode
}

/**
 * DashboardLayout
 * Shared layout for all doctot and assistant pages
 * Structure : sidebar (left, fixed) + scrollable main content
 * 
 * Sidebar reads role from AuthContext automatically
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-bg overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between bg-neutral-800 p-4 shrink-0">
                <div className="flex flex-col">
                    <h2 className='text-2xl font-BabesNeue text-primary tracking-wider'>
                        Dispensary
                    </h2>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <FiMenu size={24} />
                </button>
            </div>

            <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default DashboardLayout