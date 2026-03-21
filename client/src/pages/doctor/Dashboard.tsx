
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'
import { useQueue } from '../../hooks/useQueue';
import { useState } from 'react';
import queueService from '../../api/services/queue.service';
import type { IAppointment, AppointmentStatus } from '../../types/appointment.types'

import { GiPlayerNext } from "react-icons/gi";
import { TbPlayerTrackNextFilled } from "react-icons/tb";
import { FaArrowRight, FaPause } from "react-icons/fa";
import { TbTriangleFilled } from "react-icons/tb";
import { MdDoorSliding } from "react-icons/md";

/**
 * Doctor Dashboard
 * Shows today's queue with live updates via Socket.io
 * Doctor can: Call Next, view stats, start consultation
 */

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
    const [isActioning, setIsActioning] = useState(false);
    const [actionError, setActionError] = useState("");


    // Handlers_____________________________________________________________________________________________
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

    const handlePause = async () => {
        setIsActioning(true);

        try {
            await queueService.pause();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to pause queue");
        } finally {
            setIsActioning(false)
        }
    };

    const handleResume = async () => {
        setIsActioning(true);

        try {
            await queueService.resume();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to Resume queue");
        } finally {
            setIsActioning(false)
        }
    };

    const handleClose = async () => {

        const confirmed = window.confirm(
            "Are you sure you want to close the queue for today?"
        );
        if (!confirmed) return;

        setIsActioning(true);
        try {
            await queueService.close();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setActionError(e.response?.data?.message || "Failed to close queue");
        } finally {
            setIsActioning(false)
        }
    };

    // Components___________________________________________________________________________________________
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2
                        ${queue?.status === "open"
                            ? "bg-primary-light text-primary-dark"
                            : queue?.status === "paused"
                                ? "bg-orange-50 text-warning"
                                : "bg-gray-bg text-gray-text"
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full ${queue?.status === "open" ? "bg-green-500 animate-ping" : queue?.status === "paused" ? "bg-orange-500" : "bg-gray-500"}`} />


                    {queue?.status === "open" ? "Queue Open" :
                        queue?.status === "paused" ? "Queue Paused" :
                            queue ? "Queue Closed" : "Queue not Initialized"}

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

                    const colors: Record<string, string> = {
                        accent: "border-l-accent",
                        primary: "border-l-primary",
                        warning: "border-l-warning",
                        danger: "border-l-danger",
                    };

                    return (

                        <div
                            key={stat.label}
                            className={`border border-gray-200 bg-white rounded-lg shadow-md border-l-3 ${colors[stat.color]} px-4 py-3`}
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

            {/* --- Queue Controllers --- */}
            {queue && queue.status !== 'closed' && (
                <div className='flex items-center gap-3 mb-4 card'>
                    {queue.status === "open" ? (
                        <button
                            onClick={handlePause}
                            disabled={isActioning}
                            className='btn-outlined flex items-center gap-2 text-sm'
                        >
                            <FaPause />
                            Pause Queue
                        </button>
                    ) : queue.status === "paused" ? (
                        <button
                            onClick={handleResume}
                            disabled={isActioning}
                            className='btn-outlined border-warning text-warning flex items-center gap-2 text-sm'
                        >
                            < TbTriangleFilled className='rotate-90' />
                            Resume Queue
                        </button>
                    ) : null}

                    <button
                        onClick={handleClose}
                        disabled={isActioning}
                        className='btn-danger flex items-center gap-2 text-sm'
                    >
                        <MdDoorSliding />
                        Close Queue
                    </button>
                </div>
            )}

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
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-gray-border'>
                                    {["Token", "Patient", "Type", "Est.Time", "Status", "Action"].map(
                                        (header) => (
                                            <th
                                                key={header}
                                                className='text-left text-xs font-bold text-gray-text pb-3 pr-4'
                                            >
                                                {header}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appt: IAppointment) => {
                                    const isServing = appt.status === "serving";
                                    const patient = appt.patientId as unknown as {
                                        name: string; phone: string
                                    };

                                    return (
                                        <tr
                                            key={appt._id}
                                            className={`transition-colors 
                                                ${isServing
                                                    ? "bg-primary-light border-l-4 border-l-primary"
                                                    : "hover:bg-gray-bg"
                                                }
                                            `}
                                        >
                                            {/* Token */}
                                            <td className='py-3 pl-2 pr-4'>
                                                <span className='font-mono font-bold text-dark'>
                                                    {appt.tokenCode}
                                                </span>
                                            </td>

                                            {/* Patient */}
                                            <td className='py-3 pr-4'>
                                                <p className='font-medium text-dark'>
                                                    {patient?.name || "Unknown"}
                                                </p>
                                                <p className='text-gray-text text-xs'>
                                                    {patient?.phone || ""}
                                                </p>
                                            </td>

                                            {/* Type */}
                                            <td className='py-3 pr-4'>
                                                <TypeBadge type={appt.type} />
                                            </td>

                                            {/* Est time */}
                                            <td className='py-3 pr-4 text-gray-text'>
                                                {appt.estimatedTime}
                                            </td>

                                            {/* Status */}
                                            <td className='py-3 pr-4'>
                                                <StatusBadge status={appt.status} />
                                            </td>

                                            {/* Action */}
                                            <td className='py-3'>
                                                {isServing ? (
                                                    <button
                                                        onClick={() => navigate(`/doctor/consultation/${appt._id}`)}
                                                        className='btn-secondary flex items-center gap-2 text-xs'
                                                    >
                                                        Start Consultation
                                                        < FaArrowRight size={16} />
                                                    </button>
                                                ) : (
                                                    <span className='text-gray-text text-xs'>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard