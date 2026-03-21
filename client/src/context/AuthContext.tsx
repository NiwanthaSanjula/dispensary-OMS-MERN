import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IAuthResponse, IUser } from "../types/user.types";

/**
 * Auth Context
 * Provides authentication state and actions to the entire app
 * Persists user and token to localStorage for page refresh survival
*/
interface AuthContextType {
    user: IUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;  // true while cjecking localStorage on mount
    login: (data: IAuthResponse) => void;
    logout: () => void;
    updateUser: (user: IUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * On mount - restore auth state from localStorage
     * This prevents the user from being logged out on every page refresh
    */
    useEffect(() => {
        const storedtoken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (storedtoken && storedUser) {
            try {
                setAccessToken(storedtoken);
                setUser(JSON.parse(storedUser));

            } catch (error) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user")
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handleForcedLogout = () => {
            setAccessToken(null);
            setUser(null);
        };
        window.addEventListener("auth:logout", handleForcedLogout);
        return () => window.removeEventListener("auth:logout", handleForcedLogout);
    }, []);


    /**
     * login - called after successfull /api/auth/login or /api/auth/register
     * stores token + user is stae and localStorage
    */
    const login = (data: IAuthResponse) => {
        setAccessToken(data.accessToken);
        setUser(data.user as IUser);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user))
    };

    /**
     * logout - clear all auth state
     * The actual cookie clearing happens via POST /api/auth/logout
    */
    const logout = () => {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    };


    /**
     * updateUser - used when profile info changes
     */
    const updateUser = (updatedUser: IUser) => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser))
    };


    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isAuthenticated: !!user && !!accessToken,
                isLoading,
                login,
                logout,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


/**
 * useAuth hook - consume AuthContext anywhere in the app
 * Throws if used outside AuthProvider ( safety net )
 * 
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}