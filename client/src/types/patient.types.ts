export type Gender = "male" | "female";

export interface IPatient {
    _id: string;
    userId: string | null;
    name: string;
    phone: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string
    allergies: string[];
    booldGroup?: string;
    address: string;
    createdAt: string
}