import type { IconType } from "react-icons";
import type { UserRole } from "../types/user.types";
import { MdDashboard } from "react-icons/md";
import { FaUsers, FaCalendarAlt, FaBoxes, FaPrescriptionBottle, FaUserAlt } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";

export interface NavItem {
    label: string;
    path: string;
    icon: IconType;
}

/**
 * Sidebar navigation config per role
 * Each role only sees their own relevant links
 */

export const sidebarConfig: Record<UserRole, NavItem[]> = {
    doctor: [
        { label: "Dashboard", path: "/doctor/dashboard", icon: MdDashboard },
        { label: "Patients", path: "/management/patients", icon: FaUsers },
        { label: "Appointments", path: "/management/appointments", icon: FaCalendarAlt },
        { label: "Inventory", path: "/management/inventory", icon: FaBoxes },
        { label: "Settings", path: "/doctor/settings", icon: IoIosSettings },
    ],

    assistant: [
        { label: "Dashboard", path: "/assistant/dashboard", icon: MdDashboard },
        { label: "Patients", path: "/management/patients", icon: FaUsers },
        { label: "Appointments", path: "/management/appointments", icon: FaCalendarAlt },
        { label: "Inventory", path: "/management/inventory", icon: FaBoxes },
    ],

    patient: [
        { label: "Dashboard", path: "/patient/dashboard", icon: MdDashboard },
        { label: "Appointments", path: "/patient/appointments", icon: FaCalendarAlt },
        { label: "Prescriptions", path: "/patient/prescriptions", icon: FaPrescriptionBottle },
        { label: "Profile", path: "/patient/profile", icon: FaUserAlt },
    ],
};