/**
 * Medicine Service
 * Used in prescription builder to search available medicines
 */

import type { IMedicine, IStockLog } from "../../types/medicine.types";
import api from "../axios";

export interface CreateMedicinePayload {
    name: string;
    category: string;
    unit: string;
    stockQty?: number;
    alertThreshold: number;
    supplierName?: string;
    supplierPhone?: string;
}



const medicineService = {
    /**
   * Get all active medicines
   * Optional category filter
   */
    getAll: async (category?: string): Promise<IMedicine[]> => {
        const params = category ? { category } : {};
        const { data } = await api.get<{ data: IMedicine[] }>(
            "/medicines", { params }
        );
        return data.data;
    },

    /**
   * Get medicines below alert threshold
   * Used in low stock alert banners
   */
    getLowStock: async (): Promise<IMedicine[]> => {
        const { data } = await api.get<{ data: IMedicine[] }>(
            "/medicines/low-stock"
        );
        return data.data;
    },

    getById: async (id: string): Promise<IMedicine> => {
        const { data } = await api.get<{ data: IMedicine }>(
            `/medicines/${id}`
        );
        return data.data;
    },

    create: async (payload: CreateMedicinePayload): Promise<IMedicine> => {
        const { data } = await api.post<{ data: IMedicine }>(
            "/medicines", payload
        );
        return data.data;
    },

    update: async (
        id: string,
        payload: Partial<CreateMedicinePayload>
    ): Promise<IMedicine> => {
        const { data } = await api.put<{ data: IMedicine }>(
            `/medicines/${id}`, payload
        );
        return data.data;
    },

    deactivate: async (id: string): Promise<void> => {
        await api.delete(`/medicines/${id}`);
    },

    addStock: async (id: string, quantity: number): Promise<IMedicine> => {
        const { data } = await api.post<{ data: IMedicine }>(
            `/medicines/${id}/stock`, { quantity }
        );
        return data.data;
    },

    getStockLogs: async (medicineId?: string): Promise<IStockLog[]> => {
        const params = medicineId ? { medicineId } : {};
        const { data } = await api.get<{ data: IStockLog[] }>(
            "/medicines/stocklogs", { params }
        );
        return data.data;
    },
}

export default medicineService;