import { type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type UserRole } from "../types/user.types";

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
    return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
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
                <Route path="/assistant/patients" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor", "assistant"]} >
                            <PatientManagement />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/assistant/inventory" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor", "assistant"]} >
                            <Inventory />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/assistant/appointments" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor", "assistant"]} >
                            <Appointments />
                        </RoleGuard>
                    </ProtectedRoute>
                } />


                {/** -------------------- Doctor Routes -------------------- **/}
                <Route path="/doctor/dashboard" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor"]} >
                            <DoctorDashboard />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/doctor/consultation/:id" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor"]} >
                            <Consultation />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/doctor/patients" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor"]} >
                            <PatientList />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/doctor/patients/:id" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor"]} >
                            <PatientProfile />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/doctor/settings" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["doctor"]} >
                            <DoctorSettings />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                {/** -------------------- Assistant Routes -------------------- **/}
                <Route path="/assistant/dashboard" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["assistant"]} >
                            <AssistantDashboard />
                        </RoleGuard>
                    </ProtectedRoute>
                } />



                {/** -------------------- Patients Routes -------------------- **/}
                <Route path="/patient/dashboard" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["patient"]} >
                            <PatientDashboard />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/patient/book" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["patient"]} >
                            <BookAppointment />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/patient/appointments" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["patient"]} >
                            <MyAppointments />
                        </RoleGuard>
                    </ProtectedRoute>
                } />
                <Route path="/patient/prescriptions" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["patient"]} >
                            <MyPrescriptions />
                        </RoleGuard>
                    </ProtectedRoute>
                } />

                <Route path="/patient/symptom-check" element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["patient"]} >
                            <SymptomCheck />
                        </RoleGuard>
                    </ProtectedRoute>
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

