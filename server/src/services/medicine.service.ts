import { Medicine } from "../models/Medicine.model";
import { StockLog } from "../models/Stocklog.model";
import { ApiError } from "../utils/ApiError";
import stockService from "./stock.service";



export interface CreateMedicinePayload {
    name: string;
    category: string;
    unit: string;
    stockQty?: number;
    alertThreshold: number;
    supplierName?: string;
    supplierPhone?: string;
}

/**
 * Medicine Service
 * Handles medicine catalog queries
 */
const medicineService = {

    /**
     * Get all active medicines
     * Optional category filter
     */
    getAll: async (category?: string) => {
        const filter: Record<string, unknown> = { isActive: true };
        if (category) filter.category = category;
        return await Medicine.find(filter).sort({ name: 1 });
    },

    /**
     * Get medicines below alert threshold
     * Used in low stock dashboard banners
     */
    getLowStock: async () => {
        return await Medicine.find({
            isActive: true,
            $expr: { $lte: ["$stockQty", "$alertThreshold"] },
        }).sort({ stockQty: 1 });
    },

    /**
     * Get single medicine by ID
     */
    getById: async (id: string) => {
        const medicine = await Medicine.findById(id);
        if (!medicine) throw new ApiError(404, "Medicine not found");
        return medicine;
    },

    /**
   * Add new medicine to inventory
   * Assistant only
   */
    create: async (payload: CreateMedicinePayload) => {
        const existing = await Medicine.findOne({ name: payload.name });
        if (existing) {
            throw new ApiError(409, "A medicine with this name already exists");
        }
        return await Medicine.create(payload);
    },

    /**
   * Update medicine info or alert threshold
   */
    update: async (id: string, payload: Partial<CreateMedicinePayload>) => {
        const medicine = await Medicine.findByIdAndUpdate(
            id,
            payload,
            { new: true, runValidators: true }
        );
        if (!medicine) throw new ApiError(404, "Medicine not found");
        return medicine;
    },

    /**
   * Soft deactivate medicine
   * Never hard delete — historical prescriptions reference it
   */
    deactivate: async (id: string) => {
        const medicine = await Medicine.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
        if (!medicine) throw new ApiError(404, "Medicine not found");
        return medicine;
    },

    /**
   * Manually add stock
   * Creates StockLog (type: in, reason: manual_add)
   */
    addStock: async (
        id: string,
        quantity: number,
        performedBy: string
    ) => {
        if (quantity < 1) {
            throw new ApiError(400, "Quantity must be at least 1");
        }
        const medicine = await Medicine.findById(id);
        if (!medicine) throw new ApiError(404, "Medicine not found");
        if (!medicine.isActive) throw new ApiError(400, "Medicine is inactive");

        await stockService.addStock({ medicineId: id, quantity, performedBy });

        // Return updated medicine
        return await Medicine.findById(id);
    },

    /**
   * Get stock movement history
   * Optional medicineId filter
   */
    getStockLogs: async (medicineId?: string) => {
        const filter: Record<string, unknown> = {};
        if (medicineId) filter.medicineId = medicineId;

        return await StockLog.find(filter)
            .populate("medicineId", "name unit")
            .populate("performedBy", "name role")
            .populate("referenceId", "issuedAt")
            .sort({ createdAt: -1 })
            .limit(200);
    },

};

export default medicineService;