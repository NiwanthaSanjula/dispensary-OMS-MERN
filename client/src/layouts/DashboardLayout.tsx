import type { ReactNode } from "react";
import Sidebar from "../components/layouts/Sidebar";

interface DashboardLayoutProps {
    children: ReactNode
}

/**
 * DashboardLayout
 * Shared layout for all doctot and assistant pages
 * Structure : sidebar (left, fixed) + scrollable main content
 * 
 * Sidebar reads role from AuthContext automatically, no need pass props
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <div className="flex h-screen bg-gray-bg overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default DashboardLayout