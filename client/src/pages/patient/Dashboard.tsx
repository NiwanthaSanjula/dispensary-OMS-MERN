import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import type { IAppointment } from '../../types/appointment.types';
import type { LiveQueueResponse } from '../../api/services/queue.service';
import appointmentService from '../../api/services/appointment.service';
import queueService from '../../api/services/queue.service';

import { FaCalendarAlt } from "react-icons/fa";
import { getTodayLocal, toLocalDateString } from '../../config/dateHelpers';

/**
 * Patient Dashboard
 * Mobile-first layout via PatientLayout
 */

const Dashboard = () => {

    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const [todayAppointment, setTodayAppointment] = useState<IAppointment | null>(null);
    const [liveData, setLiveData] = useState<LiveQueueResponse | null>(null);
    const [recentAppts, setRecentAppts] = useState<IAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch patient's appointments and live queue data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Get all patients appointments
                const allAppointments = await appointmentService.getAll();

                // find  today's appointment if any
                const today = getTodayLocal()
                const todayAppointment = allAppointments.find((a) => {
                    const apptDate = toLocalDateString(a.date)
                    return (
                        apptDate === today &&
                        !["cancelled", "completed", "noshow"].includes(a.status)
                    );
                })

                setTodayAppointment(todayAppointment || null);

                // Get recent appointment (last 3, excludeing today)
                const recent = allAppointments.filter((a) => {
                    const apptDate = toLocalDateString(a.date);
                    return apptDate !== today;
                }).slice(0, 3);

                setRecentAppts(recent)

                // Get live queue date for position calculation
                if (todayAppointment) {
                    const live = await queueService.getLive();
                    setLiveData(live);
                }

            } catch {
                // silently fails - patient may not have 
            } setIsLoading(false);
        };

        fetchData();
    }, [])

    // Listen for live queue updates via Socket.io
    useEffect(() => {
        if (!socket || !todayAppointment) return;

        const handleQueueUpdate = async () => {
            try {
                const live = await queueService.getLive();
                setLiveData(live)

            } catch (error) {/**Ignore */ }
        };

        socket.on("queue:updated", handleQueueUpdate);
        socket.on("queue:closed", handleQueueUpdate);

        return () => {
            socket.off("queue:updated", handleQueueUpdate);
            socket.off("queue:closed", handleQueueUpdate);
        }
    }, [socket, todayAppointment]);

    /**
     * Calculate how many patient are ahead
     */
    const getPositionAhead = (): number | null => {
        if (!liveData || !todayAppointment) return null;
        const myToken = todayAppointment.tokenNumber;
        const currentToken = liveData.currentToken;
        if (myToken <= currentToken) return 0;
        return liveData.nextTokens.filter(
            (t) => t.tokenNumber < myToken
        ).length;
    }

    const positionAhead = getPositionAhead();


    return (
        <div className='space-y-5'>

            {/* Header text */}
            <div className=''>
                <h1 className='text-lg font-bold text-gray-600'>
                    Hello, {user?.name?.split(" ")[0]}
                </h1>
                <p>
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                    })}
                </p>
            </div>

            {/* Action Token Card */}
            {isLoading ? (
                <div className='card text-center py-8 text-gray-text text-sm'>
                    Loading...
                </div>
            ) : todayAppointment ? (
                <div className='card border-2 border-primary relative'>
                    {/* Live indicator */}
                    <div className='absolute top-3 right-3 flex items-center gap-1.5'>
                        <div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
                        <span className='text-xs text-gray-text'>Live</span>
                    </div>

                    <p className='text-gray-text  text-xs uppercase tracking-wider mb-1'>
                        Your Token
                    </p>

                    {/* Token Number */}
                    <p className='font-mono font-bold text-dark text-4xl mb-2'>
                        {todayAppointment.tokenCode}
                    </p>

                    {/* Position */}
                    {positionAhead === 0 ? (
                        <div className='bg-primary-light rounded-lg px-3 py-2 mb-3 animate-pulse
                        '>
                            <p className='text-primary-dark font-semibold text-sm'> It's your turn! Please go in</p>
                        </div>
                    ) : positionAhead !== null ? (
                        <div className='bg-gray-bg rounded-lg px-3 py-2 mb-3'>
                            <p className="text-dark text-sm">
                                <span className="font-bold text-xl text-dark">
                                    {positionAhead}
                                </span>{" "}
                                {positionAhead === 1 ? "patient" : "patients"} ahead of you
                            </p>
                        </div>
                    ) : null}

                    {/* Estimated time + status */}
                    <div className='flex items-center justify-between text-sm border-t border-gray-border pt-3 mt-1'>
                        <div>
                            <p className='text-gray-text  text-xs'>Estimated time</p>
                            <p className='font-medium text-dark'>
                                {todayAppointment.estimatedTime}
                            </p>
                        </div>

                        <div className='text-right'>
                            <p className='text-gray-text text-xs'>Status</p>
                            <p className={`text-sm font-medium capitalize ${todayAppointment.status === "serving"
                                ? "text-primary" : "text-dark"
                                }`}>
                                {todayAppointment.status}
                            </p>
                        </div>
                    </div>

                    {/* Now serving */}
                    {liveData && liveData.currentTokenCode && (
                        <p className='text-xs text-gray-text mt-2 text-center'>
                            Now serving: {" "}
                            <span className='font-mono font-bold text-primary'>
                                {liveData.currentTokenCode}
                            </span>
                        </p>
                    )}
                </div>
            ) : (

                /** No Appiintments today*/
                <div className='card border-2 border-dashed border-gray-border text-center py-8'>
                    <FaCalendarAlt className='text-3xl text-gray-500' />
                    <p className='font-medium text-dark text-sm'>No appointment today</p>
                    <p className='text-gray-text text-xs mt-1 mb-4'>Book a slot for your next visit</p>
                    <button
                        onClick={() => navigate("/patient/book")}
                        className='btn-primary text-sm px-6'
                    >
                        Book Appointment
                    </button>
                </div>
            )}

            {/* ── Recent Visits ── */}
            {recentAppts.length > 0 && (
                <div>
                    <h2 className="section-title">Recent Visits</h2>
                    <div className="space-y-2">
                        {recentAppts.map((appt) => (
                            <div key={appt._id}
                                className="card flex items-center justify-between py-3">
                                <div>
                                    <p className="font-mono text-sm font-bold text-dark">
                                        {appt.tokenCode}
                                    </p>
                                    <p className="text-gray-text text-xs mt-0.5">
                                        {new Date(appt.date).toLocaleDateString("en-US", {
                                            month: "short", day: "numeric", year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${appt.status === "completed"
                                    ? "bg-primary-light text-primary-dark"
                                    : appt.status === "noshow"
                                        ? "bg-danger-light text-danger"
                                        : "bg-gray-bg text-gray-text"
                                    }`}>
                                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}



        </div>
    )
}

export default Dashboard