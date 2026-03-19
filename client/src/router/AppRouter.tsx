import { type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type UserRole } from "../types/user.types";


// Layouts_______________________________________________________________________________________________
import DashboardLayout from "../layouts/DashboardLayout";
import PatientLayout from "../layouts/PatientLayout";

// Public Page__________________________________________________________________________________________
import GuestBooking from "../pages/public/GuestBooking";
import Landing from "../pages/public/Landing";
import LiveBoard from "../pages/public/LiveBoard";
import TokenTracker from "../pages/public/TokenTracker";

// Auth Pages____________________________________________________________________________________________
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Shared Pages__________________________________________________________________________________________
import PatientManagement from "../pages/shared/PatientManagement";
import Inventory from "../pages/shared/Inventory";
import Appointments from "../pages/shared/Appointments";

// Doctor Pages___________________________________________________________________________________________
import DoctorDashboard from "../pages/doctor/Dashboard";
import Consultation from "../pages/doctor/Consultation";
import PatientList from "../pages/doctor/PatientList";
import PatientProfile from "../pages/doctor/PatientProfile";
import DoctorSettings from "../pages/doctor/Settings";

// Assistant Pages________________________________________________________________________________________
import AssistantDashboard from "../pages/assistant/Dashboard";

// Patient Pages__________________________________________________________________________________________
import PatientDashboard from "../pages/patient/Dashboard";
import BookAppointment from "../pages/patient/BookAppointment";
import MyAppointments from "../pages/patient/MyAppointments";
import MyPrescriptions from "../pages/patient/MyPrescriptions";
import SymptomCheck from "../pages/patient/SymptomCheck";



/**
 * Protected Routes
 * Redirects to /auth/login if user is not authenticated
 * Shows nothing while auth state is loading ( prevents flash )
*/
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;
    return isAuthenticated
        ? <>{children}</>
        : <Navigate to="/auth/login" replace />;
};

/**
 * RoleGuard
 * Redirects to correct dashboard if user access wrong role's page
 */
const RoleGuard = ({
    children,
    allowedRoles,
}: {
    children: ReactNode;
    allowedRoles: UserRole[];
}) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/auth/login" replace />;

    if (!allowedRoles.includes(user.role)) {
        //  Redirect to their own dashboard
        const dashboardMap: Record<UserRole, string> = {
            doctor: "/doctor/dashboard",
            assistant: "/assistant/dashboard",
            patient: "/patinet/dashboard"
        };
        return <Navigate to={dashboardMap[user.role]} replace />
    }
    return <>{children}</>;
};

/**
 * RedirectByRole
 * used on /auth/login success - send each role to their dashboard
 */
export const RedirectByRole = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/auth/login" replace />;

    const dashboardMap: Record<UserRole, string> = {
        doctor: "/doctor/dashboard",
        assistant: "/assistant/dashboard",
        patient: "/patient/dashboard"
    };
    return <Navigate to={dashboardMap[user.role]} replace />
};

/**
 * Helper - wraps a doctor/assistant page with DashboardLayout
 */
const DashboardRoute = ({
    children,
    allowedRoles
}: {
    children: ReactNode;
    allowedRoles: UserRole[];
}) => (
    <ProtectedRoute>
        <RoleGuard allowedRoles={allowedRoles}>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </RoleGuard>
    </ProtectedRoute>
)

/**
 * Helper - wraps a patient page with PatientLayout
 */
const PatientRoute = ({ children }: { children: ReactNode }) => (
    <ProtectedRoute>
        <RoleGuard allowedRoles={["patient"]}>
            <PatientLayout>
                {children}
            </PatientLayout>
        </RoleGuard>
    </ProtectedRoute>
)

/**
 * AppRouter
*/
const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/** -------------------- Public Routes -------------------- **/}
                <Route path="/" element={<Landing />} />
                <Route path="/book" element={<GuestBooking />} />
                <Route path="/track" element={<TokenTracker />} />
                <Route path="/live-board" element={<LiveBoard />} />

                {/** -------------------- Auth Routes -------------------- **/}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />

                {/** -------- Shared Routes ( Doctor + Assistant) -------- **/}
                <Route path="/management/patients" element={
                    <DashboardRoute allowedRoles={["doctor", "assistant"]}>
                        <PatientManagement />
                    </DashboardRoute>
                } />

                <Route path="/management/inventory" element={
                    <DashboardRoute allowedRoles={["doctor", "assistant"]}>
                        <Inventory />
                    </DashboardRoute>
                } />

                <Route path="/management/appointments" element={
                    <DashboardRoute allowedRoles={["doctor", "assistant"]}>
                        <Appointments />
                    </DashboardRoute>
                } />


                {/** -------------------- Doctor Routes -------------------- **/}
                <Route path="/doctor/dashboard" element={
                    <DashboardRoute allowedRoles={["doctor"]}>
                        <DoctorDashboard />
                    </DashboardRoute>
                } />
                <Route path="/doctor/consultation/:id" element={
                    <DashboardRoute allowedRoles={["doctor"]}>
                        <Consultation />
                    </DashboardRoute>
                } />

                <Route path="/doctor/patients" element={
                    <DashboardRoute allowedRoles={["doctor"]}>
                        <PatientList />
                    </DashboardRoute>
                } />

                <Route path="/doctor/patients/:id" element={
                    <DashboardRoute allowedRoles={["doctor"]}>
                        <PatientProfile />
                    </DashboardRoute>
                } />

                <Route path="/doctor/settings" element={
                    <DashboardRoute allowedRoles={["doctor"]}>
                        <DoctorSettings />
                    </DashboardRoute>
                } />

                {/** -------------------- Assistant Routes -------------------- **/}
                <Route path="/assistant/dashboard" element={
                    <DashboardRoute allowedRoles={["assistant"]}>
                        <AssistantDashboard />
                    </DashboardRoute>
                } />


                {/** -------------------- Patients Routes -------------------- **/}
                <Route path="/patient/dashboard" element={
                    <PatientRoute>
                        <PatientDashboard />
                    </PatientRoute>
                } />

                <Route path="/patient/book" element={
                    <PatientRoute>
                        <BookAppointment />
                    </PatientRoute>
                } />

                <Route path="/patient/appointments" element={
                    <PatientRoute>
                        <MyAppointments />
                    </PatientRoute>
                } />

                <Route path="/patient/prescriptions" element={
                    <PatientRoute>
                        <MyPrescriptions />
                    </PatientRoute>
                } />

                <Route path="/patient/symptom-check" element={
                    <PatientRoute>
                        <SymptomCheck />
                    </PatientRoute>
                } />


                {/** ---- Redirect / dashboard -> role-specific dashboard ---- **/}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <RedirectByRole />
                    </ProtectedRoute>
                } />

                {/** ---------------------- 404 Fallback ---------------------- **/}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRouter

