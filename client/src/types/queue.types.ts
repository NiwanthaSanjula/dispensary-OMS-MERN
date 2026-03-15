export type QueueStatus = "open" | "closed" | "paused";

export interface IQueue {
    _id: string;
    date: string;
    maxLimit: number;
    opneningTime: string;
    avgConsultationMinutes: number;
    currentToken: number;
    lastToken: number;
    status: QueueStatus;
}

/**
 * Shape emitted by Socket.io queue:updated event
*/
export interface IQueueUpdate {
    currentToken: number;
    waitingCount: number;
    queue: import("./appointment.types").IAppointment[];
}