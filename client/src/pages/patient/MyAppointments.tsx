/**
 * My Appointments — patient's full appointment history
 * Shows past + upcoming appointments with status badges
 */

import { useEffect, useState } from "react";
import type { AppointmentStatus, IAppointment } from "../../types/appointment.types";
import appointmentService from "../../api/services/appointment.service";
import { getTodayLocal, toLocalDateString } from "../../config/dateHelpers";

const MyAppointments = () => {
    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await appointmentService.getAll();
                const sorted = data.sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setAppointments(sorted);

            } catch (err) {
                const e = err as { response?: { data?: { message?: string } } };
                setError(e.response?.data?.message || "Failed to load appointments");
            } finally {
                setIsLoading(false);
            }
        }
        fetchAppointments();
    }, []);

    const statusStyles: Record<AppointmentStatus, string> = {
        waiting: "bg-gray-bg text-gray-text",
        serving: "bg-primary-light text-primary-dark",
        completed: "bg-primary-light text-primary-dark",
        noshow: "bg-danger-light text-danger",
        cancelled: "bg-orange-50 text-warning",
    };

    if (isLoading) {
        return (
            <div className="text-center py-16 text-gray-text text-sm">
                Loading appointments...
            </div>
        );
    }


    return (
        <div className="space-y-5">
            <div>
                <h1 className="page-title">My Appointments</h1>
                <p className="text-gray-text text-sm">
                    {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} total
                </p>
            </div>

            {error && (
                <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {appointments.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-3xl mb-3">📅</p>
                    <p className="font-medium text-dark">No appointments yet</p>
                    <p className="text-gray-text text-sm mt-1">
                        Your appointments will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map((appt) => {

                        const today = getTodayLocal()

                        const apptDate = toLocalDateString(appt.date)
                        const isToday = apptDate === today;
                        const dateObj = new Date(appt.date);


                        return (
                            <div
                                key={appt._id}
                                className={`card ${isToday ? "border-l-4 border-l-primary" : ""
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Date block */}
                                        <div className="text-center bg-gray-bg rounded-lg
                                                        px-3 py-2 min-w-[52px]">
                                            <p className="text-xs text-gray-text font-medium">
                                                {dateObj.toLocaleDateString("en-Us", { month: "short" })}
                                            </p>
                                            <p className="text-xl font-bold text-dark leading-tight">
                                                {dateObj.getDate()}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono font-bold text-dark">
                                                    {appt.tokenCode}
                                                </p>
                                                {isToday && (
                                                    <span className="text-xs bg-primary text-white
                                                        px-2 py-0.5 rounded-full font-medium">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-text text-xs mt-0.5">
                                                ~{appt.estimatedTime} ·{" "}
                                                <span className="capitalize">{appt.type}</span>
                                            </p>
                                            {appt.notes && (
                                                <p className="text-gray-text text-xs mt-1 italic">
                                                    "{appt.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span className={`text-xs px-2.5 py-1 rounded-full
                                    font-medium capitalize shrink-0
                                    ${statusStyles[appt.status]}`}>
                                        {appt.status}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default MyAppointments