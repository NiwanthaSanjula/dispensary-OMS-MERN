import api from "../axios";
import { type IQueue } from '../../types/queue.types';
import type { IAppointment } from "../../types/appointment.types";

export interface TodayQueueResponse {
    queue: IQueue | null;
    appointments: IAppointment[];
}

export interface LiveQueueResponse {
    curretToken: number;
    currentTokenCode: string | null;
    waitingCount: number;
    status: string;
    nextTokens: {
        _id: string;
        tokenCode: string;
        tokenNumber: number;
        estimatedTime: string;
    }[]
}

export interface AvailableDates {
    date: string;
    availableSlots: number;
    totalSlots: number;
}

export interface IssueTokenPayload {
    patientId: string;
    date: string;
    type: "online" | "manual";
    notes?: string;
}

const queueService = {

    /**
     * Init today's queue
     * Called by assistant each morning 
     */
    init: async (): Promise<IQueue> => {
        const { data } = await api.post<{ data: IQueue }>("/queue/init");
        return data.data
    },

    /**
     * Get today's full queue + appointments
     * used by doctor and assistant dashboards
     */
    getToday: async (): Promise<TodayQueueResponse> => {
        const { data } = await api.get<{ data: TodayQueueResponse }>("/queue/today");
        return data.data;
    },

    /**
     * Get live queue data - no auth needed
     * used by /live-board and /track
     */
    getLive: async (): Promise<LiveQueueResponse> => {
        const { data } = await api.get<{ data: LiveQueueResponse }>("/queue/live");
        return data.data
    },

    /**
     * Issue a token for a given date
     * create a appointment record
     */
    issueToken: async (payload: IssueTokenPayload): Promise<IAppointment> => {
        const { data } = await api.post<{ data: IAppointment }>(
            "/queue/token",
            payload
        );
        return data.data
    },

    /**
     * Advance queue to next token
     * Triggers Socket.io queue:updated on backend
     */
    callNext: async (): Promise<void> => {
        await api.put("/queue/next");
    },

    /**
     * Pause Queue
     */
    pause: async (): Promise<void> => {
        await api.put("/queue/pause")
    },
    /**
     * Resume Queue
     */
    resume: async (): Promise<void> => {
        await api.put("/queue/resume")
    },

    /**
     * Close queue for the day
     */
    close: async (): Promise<void> => {
        await api.put("/queue/close")
    },

    /**
     * Get Available booking dates
     * Used in patient + guest booking forms
     */
    getAvailableDates: async (): Promise<AvailableDates[]> => {
        const { data } = await api.get<{ data: AvailableDates[] }>(
            "/queue/available-dates"
        );
        return data.data;
    },
};

export default queueService;