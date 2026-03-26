import axios from "axios";

/**
 * Axios instance with base configuration
 * All API calls in app use this instance - never raw axios
 * 
 * Interceptors handle:
 *     Request  -> auto-attach access token to every request
 *     Response -> on 401, attempt silent token refresh then retry
*/
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    },
});


/**
 * [CHANGED] Dedicated axios instance for the refresh call only.
 * Using the main `api` instance caused the response interceptor to catch
 * a 401 from /auth/refresh itself and trigger another refresh → infinite loop.
 * This plain instance has no interceptors attached, so it fails cleanly.
*/
const refreshApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL + "/api",
    withCredentials: true,  // Still needs credentials to send the httpOnly cookie
});


/**
 * Request interceptor
 * Reads access token from localStorage and attaches it to every request
 * If no access token, request goes through without auth header
*/
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Handles 401 unauthorized responses - silently refreshs token and retries
 * 
 * Flow:
 *  Request fails with 401
 *      -> POST  /api/auth/refresh
 *      -> Stores new access token
 *      -> Retry original request with new token
 *      -> If refresh also fails -> clear storage -> dedirect to login 
*/
let isRefreshing = false;

//  Queue of requests waiting for token refresh to complete
let failedQueue: {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string)
        }
    });
    failedQueue = []
};

api.interceptors.response.use(
    (response) => response,     // Pass through successfull response.If 200 OK, Just pass the response to app

    // This runs when req. fails
    async (error) => {
        const originalRequest = error.config;   // Axios stores the original request configuration

        // only handle 401s that haven't been retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                //  Another request is already refreshing - queue this one
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                //  Attempt to refresh using httpOnly cookie
                const { data } = await refreshApi.post("/auth/refresh");
                const newToken = data.data.accessToken;

                localStorage.setItem("accessToken", newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                return api(originalRequest);

            } catch (refreshError) {
                //  Refresh failed - session is truly expired
                processQueue(refreshError, null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");

                // [CHANGED] Dispatch a custom event so AuthContext can clear its
                // in-memory state (user, accessToken) before the redirect fires.
                // Without this, React state stays stale and ProtectedRoute still
                // sees isAuthenticated=true on the next render cycle.
                window.dispatchEvent(new Event("auth:logout"));


                window.location.href = "/auth/login";
                return Promise.reject(refreshError);

            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error)
    }
);

export default api;
