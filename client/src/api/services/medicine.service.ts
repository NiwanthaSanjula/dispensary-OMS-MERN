/**
 * Medicine Service
 * Used in prescription builder to search available medicines
 */

import type { IMedicine } from "../../types/medicine.types";
import api from "../axios";

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
}

export default medicineService;