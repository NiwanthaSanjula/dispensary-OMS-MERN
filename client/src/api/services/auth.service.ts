import api from "../axios";
import { type IAuthResponse } from '../../types/user.types';

/**
 * Auth service
 * Handles all authentication API calls
 */

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

const authService = {
    /**
     * Register a new patient account
     * Created both User + Patient records on backend
     */
    register: async (payload: RegisterPayload): Promise<IAuthResponse> => {
        const { data } = await api.post<{ data: IAuthResponse }>(
            "/auth/register",
            payload
        );
        return data.data
    },

    /**
     * Login with email and password
     * Returns accessToken + user - also set httpOnly refresh token cookie
     */
    login: async (payload: LoginPayload): Promise<IAuthResponse> => {
        const { data } = await api.post<{ data: IAuthResponse }>(
            "/auth/login",
            payload
        );

        return data.data;
    },

    /**
     * Logout - clears the httpOnly refresh token cookie on backend
     */
    logout: async (): Promise<void> => {
        await api.post("/auth/logout");
    },


    /**
     * Refresh access token using httpOnly cookie
     * Called automatically by axios interceptor on 401
     * 
     * NOTE: THIS IS USELESS FOR NOW.BECAUSE INTERCEPTOR ALREADY HANDLING THIS ITSELF.NO NEED CIRCULAR IMPORT TO INTERCEPTOR
     */
    /*refresh: async (): Promise<string> => {
        const { data } = await api.post<{ data: { accessToken: string } }>(
            "/auth/refresh"
        );
        return data.data.accessToken
    },*/

};

export default authService;


