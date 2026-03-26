export interface IPrescriptionMedicine {
    medicineId: string;
    medicineName: string;
    dosage: string;
    duration: string;
    quantity: number
}

export interface IPrescription {
    _id: string;
    consultationId: string;
    patientId: string;
    medicines: IPrescriptionMedicine[];
    instructions?: string;
    aiSuggestUsed: boolean;
    issuedAt: string;
}