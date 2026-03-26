import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import medicineService from "../services/medicine.service";

export const getMedicines = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query;
    const medicines = await medicineService.getAll(
        category as string | undefined
    );
    res.status(200).json(new ApiResponse("Medicines fetched", medicines));
});

export const getLowStockMedicines = asyncHandler(
    async (_req: Request, res: Response) => {
        const medicines = await medicineService.getLowStock();
        res.status(200).json(new ApiResponse("Low stock medicines fetched", medicines));
    }
);

export const getMedicineById = asyncHandler(
    async (req: Request, res: Response) => {
        const medicine = await medicineService.getById(req.params.id as string);
        res.status(200).json(new ApiResponse("Medicine fetched", medicine));
    }
);

export const createMedicine = asyncHandler(
    async (req: Request, res: Response) => {
        const medicine = await medicineService.create(req.body);
        res.status(201).json(new ApiResponse("Medicine added successfully", medicine));
    }
);

export const updateMedicine = asyncHandler(
    async (req: Request, res: Response) => {
        const medicine = await medicineService.update(req.params.id as string, req.body);
        res.status(200).json(new ApiResponse("Medicine updated", medicine));
    }
);


export const deactivateMedicine = asyncHandler(
    async (req: Request, res: Response) => {
        const medicine = await medicineService.deactivate(req.params.id as string);
        res.status(200).json(new ApiResponse("Medicine deactivated", medicine));
    }
);

export const addStock = asyncHandler(
    async (req: Request, res: Response) => {
        const { quantity } = req.body;
        const medicine = await medicineService.addStock(
            req.params.id as string,
            quantity,
            req.user!._id
        );
        res.status(200).json(new ApiResponse("Stock added successfully", medicine));
    }
);

export const getStockLogs = asyncHandler(
    async (req: Request, res: Response) => {
        const { medicineId } = req.query;
        const logs = await medicineService.getStockLogs(
            medicineId as string | undefined
        );
        res.status(200).json(new ApiResponse("Stock logs fetched", logs));
    }
);