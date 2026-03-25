import api from "../axios";

export interface ISettings {
    _id: string;
    dispensaryName: string;
    doctorName: string;
    openingTime: string;
    closingTime: string;
    avgConsultationMinutes: number;
    maxDailyLimit: number;
    advanceBookingDays: number;
}

export interface UpdateSettingsPayload {
    dispensaryName: string;
    doctorName: string;
    openingTime: string;
    closingTime: string;
    avgConsultationMinutes: number;
    maxDailyLimit: number;
    advanceBookingDays: number;
}

const settingsService = {

    get: async (): Promise<ISettings> => {
        const { data } = await api.get<{ data: ISettings }>("/settings");
        return data.data;
    },

    update: async (payload: UpdateSettingsPayload): Promise<ISettings> => {
        const { data } = await api.put<{ data: ISettings }>(
            "/settings", payload
        );
        return data.data;
    },

    changePassword: async (
        currentPassword: string,
        newPassword: string
    ): Promise<void> => {
        await api.put("/settings/password", { currentPassword, newPassword });
    },
};

export default settingsService;