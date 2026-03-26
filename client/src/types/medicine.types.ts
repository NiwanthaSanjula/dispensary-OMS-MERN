export interface IMedicine {
    _id: string;
    name: string;
    category: string;
    unit: string;
    stockQty: number;
    alertThreshold: number;
    supplierName?: string;
    supplierPhone: string;
    isActive: boolean;
    createdAt: string;
}

export type StockLogReason = "prescription" | "manual_add" | "adjustment";

export interface IStockLog {
    _id: string;
    medicineId: string | IMedicine;
    type: "in" | "out";
    quantity: number;
    reason: StockLogReason;
    referenceId?: string;
    performedby: string | { name: string };
    createdAt: string;
}