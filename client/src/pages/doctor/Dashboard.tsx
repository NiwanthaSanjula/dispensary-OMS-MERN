
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'
import { useQueue } from '../../hooks/useQueue';
import { useState } from 'react';
import queueService from '../../api/services/queue.service';
import type { IAppointment, AppointmentStatus } from '../../types/appointment.types'

import { GiPlayerNext } from "react-icons/gi";
import { TbPlayerTrackNextFilled } from "react-icons/tb";

/**
 * Doctor Dashboard
 * Shows today's queue with live updates via Socket.io
 * Doctor can: Call Next, view stats, start consultation
 */

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const {
        queue,
        appointments,
        isLoading,
        error,
        waitingCount,
        completedCount,
        noShowCount,
        refetch
    } = useQueue();

    const [isCallingNext, setIsCallingNext] = useState(false);
    const [actionError, setActionError] = useState("");

    const handleCallNext = async () => {
        setIsCallingNext(true);
        setActionError("");

        try {
            await queueService.callNext()
            //  Socket.io will update state automatically

        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to advance queue");
            refetch();
        } finally {
            setIsCallingNext(false)
        }
    };

    const StatusBadge = ({ status }: { status: AppointmentStatus }) => {
        const classes: Record<AppointmentStatus, string> = {
            waiting: "badge-waiting",
            serving: "badge-serving",
            completed: "badge-completed",
            noshow: "badge-noshow",
            cancelled: "badge-cancelled"
        }
        return (
            <span className={classes[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    };

    const TypeBadge = ({ type }: { type: "online" | "manual" }) => (
        <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full
                        ${type === "online"
                    ? "bg-accent-light text-accent"
                    : "bg-gray-bg text-gray-text border border-gray-border"
                }`
            }
        >
            {type === "online" ? "Online" : "Manual"}
        </span>
    )


    return (
        <div className=''>

            {/** --- Page Header --- */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-6'>
                <div>
                    <h1>
                        Good mornig, {user?.name}
                    </h1>
                    <p className='text-gray-text text-sm'>
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Queue status pill */}
                <div
                    className={`px-3 py-1.5 rounded-full text-sm font-medium 
                        ${queue?.status === "open"
                            ? "bg-primary-light text-primary-dark"
                            : queue?.status === "paused"
                                ? "bg-orange-50 text-warning"
                                : "bg-gray-bg text-gray-text"
                        }`}>
                    {queue?.status === "open" ? "🟢 Queue Open" :
                        queue?.status === "paused" ? "⏸ Queue Paused" :
                            queue ? "🔴 Queue Closed" : "Queue not Initialized"}

                </div>
            </div>

            {/* --- ERROR BANNER */}
            {(error || actionError) && (
                <div className='bg-danger-light text-danger text-sm px-4 py-3 rounded-l-2xl mb-5'>
                    {error || actionError}
                </div>
            )}

            {/* --- Stats bar */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                {[
                    { label: "Total Today", value: appointments.length, color: "accent", },
                    { label: "Completed", value: completedCount, color: "primary" },
                    { label: "Waiting", value: waitingCount, color: "warning" },
                    { label: "No Show", value: noShowCount, color: "danger" },
                ].map((stat) => {
                    return (

                        <div
                            key={stat.label}
                            className={`border border-gray-200 rounded-lg shadow border-l-3 border-l-${stat.color} px-4 py-3`}
                        >
                            <p className={`text-4xl font-BabesNeue text-${stat.color}`}>
                                {stat.value}
                            </p>

                            <p className='text-gray-text text-sm'>
                                {stat.label}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* --- Queue Table --- */}
            <div className='card'>

                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='section-title mb-0 flex items-center gap-2'><GiPlayerNext size={20} /> Today's Queue</h2>
                    <button
                        onClick={handleCallNext}
                        disabled={isCallingNext || queue?.status !== "open" || waitingCount === 0}
                        className='btn-primary items-center gap-2'
                    >
                        {isCallingNext ? (
                            <>
                                <span className='animate-spin inline-block'>
                                    ⟳
                                </span>
                                Calling...
                            </>
                        ) : (
                            <div className='flex items-center gap-2'>
                                Next Patient
                                <TbPlayerTrackNextFilled size={20} />
                            </div>
                        )}
                    </button>
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className='text-center py-12 text-gray-text'>
                        Loading queue...
                    </div>
                ) : appointments.length === 0 ? (
                    /* Empty */
                    <div className='text-center text-gray-text'>
                        <p className='font-medium'>No appointments today</p>
                        <p className='text-sm mt-1'>
                            {queue
                                ? "Queue is open but no appointments yet"
                                : "Queue has not been initialized yet"
                            }
                        </p>
                    </div>
                ) : (
                    /* Table */
                    <div>

                    </div>
                )}

            </div>

        </div>
    )
}

export default Dashboard