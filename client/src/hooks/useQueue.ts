/**
 * useQueue Hook
 * Fetches today's queue on mount ad keeps it in async via Socket.io
 * 
 * used by: Doctor dashboard, Assistant Dashboard
 * 
 * Socket events handled:
 *      queue:updated -> refreshes queue state in real time
 *      queue:paused  -> updates status
 *      queue:closed  -> udates status
 */

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext"
import type { TodayQueueResponse } from "../api/services/queue.service";
import type { IAppointment } from "../types/appointment.types";
import queueService from "../api/services/queue.service";
import type { IQueueUpdate } from "../types/queue.types";

export const useQueue = () => {
    const { socket } = useSocket();

    const [queue, setQueue] = useState<TodayQueueResponse["queue"]>(null);
    const [appointments, setAppointments] = useState<IAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    /**
     * Fetch today's full queue data from BE
     * Called on mount and can be called manually to force refresh
    */
    const fetchQueue = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");
            const data = await queueService.getToday();
            setQueue(data.queue);
            setAppointments(data.appointments);

        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || "Failed to load queue");

        } finally {
            setIsLoading(false)
        }
    }, [])

    //  Fetch on mount
    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    // Subscribe to Socket.io events
    useEffect(() => {
        if (!socket) return;

        /**
         * queue:update - fired when doctor clicks call next
         * Updates appointments list + current token in real time
         */
        const handleQueueUpdated = (data: IQueueUpdate) => {
            setAppointments(data.queue as unknown as IAppointment[]);
            setQueue((prev) =>
                prev ? {
                    ...prev,
                    currentToken: data.currentToken,
                    status: data.status || "open"
                } : prev
            );
        };

        /**
         * queue:paused - update local status
         */
        const handleQueuePaused = () => {
            setQueue((prev) =>
                prev ? { ...prev, status: "paused" } : prev
            );
        };

        /**
         * queue:closed - update local status
         */
        const handleQueueClosed = () => {
            setQueue((prev) =>
                prev ? { ...prev, status: "closed" } : prev
            );
        };

        socket.on("queue:updated", handleQueueUpdated);
        socket.on("queue:paused", handleQueuePaused);
        socket.on("queue:closed", handleQueueClosed);

        //  Cleanup listners when component unmounts
        return () => {
            socket.off("queue:updated", handleQueueUpdated);
            socket.off("queue:paused", handleQueuePaused);
            socket.off("queue:closed", handleQueueClosed);
        };
    }, [socket])

    // Derived state - computed from appointments array
    const waitingCount = (appointments || []).filter((a) => a.status === "waiting").length;
    const completedCount = (appointments || []).filter((a) => a.status === "completed").length;
    const servingAppt = (appointments || []).find((a) => a.status === "serving");
    const noShowCount = (appointments || []).filter((a) => a.status === "noshow").length;

    return {
        queue,
        appointments,
        isLoading,
        error,
        waitingCount,
        completedCount,
        noShowCount,
        servingAppt,
        refetch: fetchQueue
    };
};