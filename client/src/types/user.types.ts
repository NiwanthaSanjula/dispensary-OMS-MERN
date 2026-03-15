/**
 * User types - Mirror the backend user model
*/

export type UserRole = "doctor" | "assistant" | "patient";

export interface IUser {
    _id: string;
    name: string;
    email: string,
    role: UserRole;
    phone: string;
    isActive: boolean;
}

/**
 * Auth response shape returned by /api/auth/login and /api/auth/register
*/
export interface IAuthResponse {
    accessToken: string;
    user: Omit<IUser, "isActive">
}
