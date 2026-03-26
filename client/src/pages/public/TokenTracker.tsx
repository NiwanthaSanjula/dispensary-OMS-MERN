import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import queueService, { type LiveQueueResponse } from '../../api/services/queue.service';

import { MdOutlineAutorenew } from "react-icons/md"
import { IoIosArrowBack } from "react-icons/io"
import { FiHash, FiClock, FiUsers } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Token tracker - /track
 * Public page - no auth required
 * Patient enters their token code to see live queue position
 *
 * Updates automatically via Socket.io when doctor advances queue
 */

const TokenTracker = () => {

    const { socket, isConnected } = useSocket();

    const [tokenInput, setTokenInput] = useState("");
    const [trackedToken, setTrackedToken] = useState<string>("");
    const [liveData, setLiveData] = useState<LiveQueueResponse | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getPosition = (): number | null => {
        if (!liveData || !trackedToken) return null;

        const trackedNumber = parseInt(trackedToken.replace("T-", ""));
        const currentToken = liveData.currentToken;

        const ahead = liveData.nextTokens.filter(
            (t) => t.tokenNumber < trackedNumber
        ).length;

        if (trackedNumber <= currentToken) return 0;
        return ahead;
    };

    const handleTrack = async () => {
        const formatted = tokenInput.toUpperCase().trim();
        if (!formatted.match(/^T-\d{3}$/)) {
            setError("Please enter a valid token code. e.g. T-012");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const data = await queueService.getLive();
            setLiveData(data);
            setTrackedToken(formatted);
        } catch (error) {
            setError("Could not fetch queue data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!socket || !trackedToken) return;

        const handleQueueUpdate = async () => {
            try {
                const data = await queueService.getLive();
                setLiveData(data);
            } catch (error) {/* ignore */ }
        };

        socket.on("queue:updated", handleQueueUpdate);
        socket.on("queue:closed", handleQueueUpdate);
        socket.on("queue:paused", handleQueueUpdate);

        return () => {
            socket.off("queue:updated", handleQueueUpdate);
            socket.off("queue:closed", handleQueueUpdate);
            socket.off("queue:paused", handleQueueUpdate);
        };
    }, [socket, trackedToken]);

    const position = getPosition();
    const trackedNumber = liveData?.nextTokens
        ? parseInt(trackedToken.replace("T-", ""))
        : null;

    const trackedInfo = liveData?.nextTokens.find(
        (t) => t.tokenNumber === trackedNumber
    );

    return (
        <div className="min-h-screen bg-gray-bg flex flex-col items-center justify-center px-4 py-10">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-BabesNeue text-dark mb-1">
                        <span className="text-primary">Track</span> Your Token
                    </h1>
                    <p className="text-gray-text text-sm">
                        Enter your token code to see your live queue position
                    </p>

                    {/* Connection indicator */}
                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                            color: isConnected ? '#16a34a' : '#ca8a04',
                            border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)'}`,
                        }}
                    >
                        <span
                            className={isConnected ? 'animate-pulse' : ''}
                            style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: isConnected ? '#22c55e' : '#eab308',
                                display: 'inline-block'
                            }}
                        />
                        {isConnected ? "Live" : "Connecting..."}
                    </div>
                </div>

                {/* Token Input Card */}
                <div className="card mb-4">
                    <label className="input-label flex items-center gap-1.5 mb-1.5">
                        <FiHash size={14} className="text-primary" />
                        Token Code
                    </label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            className="input-field font-mono uppercase tracking-widest text-center text-lg"
                            placeholder="T-013"
                            value={tokenInput}
                            maxLength={5}
                            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                        />
                        <button
                            onClick={handleTrack}
                            disabled={isLoading || !tokenInput}
                            className="btn-primary w-full"
                        >
                            {isLoading ? "Checking..." : "Track Token"}
                        </button>
                    </div>

                    {error && (
                        <p className="text-danger text-xs mt-2">{error}</p>
                    )}
                </div>

                {/* Result Card */}
                <AnimatePresence>
                    {trackedToken && liveData && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            transition={{ duration: 0.35 }}
                            className="card border-2 border-primary overflow-hidden"
                        >
                            {/* Primary header strip */}
                            <div className="bg-primary -mx-5 -mt-5 px-5 py-4 mb-5 text-center">
                                <p className="text-white text-xs uppercase tracking-widest opacity-80 mb-1">
                                    Your Token
                                </p>
                                <p className="font-mono font-bold text-white text-4xl tracking-widest">
                                    {trackedToken}
                                </p>
                            </div>

                            {/* Position */}
                            {position === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-1 mb-4 rounded-xl border border-primary bg-accent-light py-4 animate-pulse">
                                    <p className="text-primary font-bold text-lg">🎉 It's your turn!</p>
                                    <p className="text-primary-dark text-sm">Please proceed to the doctor</p>
                                </div>
                            ) : position !== null ? (
                                <div className="flex flex-col items-center justify-center gap-1 mb-4 rounded-xl border border-gray-border bg-gray-bg py-4">
                                    <div className="flex items-center gap-2 text-gray-text mb-1">
                                        <FiUsers size={14} />
                                        <span className="text-xs uppercase tracking-wider">Ahead of you</span>
                                    </div>
                                    <p className="text-4xl font-bold text-dark">{position}</p>
                                    <p className="text-gray-text text-sm">
                                        {position === 1 ? "patient" : "patients"}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-text text-sm text-center mb-4">Position unavailable</p>
                            )}

                            {/* Info Row */}
                            <div className="space-y-2">

                                {/* Estimated Time */}
                                {trackedInfo && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-text flex items-center gap-1.5">
                                            <FiClock size={13} className="text-primary" />
                                            Estimated Time
                                        </span>
                                        <span className="font-mono font-bold text-dark bg-gray-100 px-3 py-1 rounded-lg text-xs">
                                            {trackedInfo.estimatedTime}
                                        </span>
                                    </div>
                                )}

                                {/* Now Serving */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-text flex items-center gap-1.5">
                                        <FiHash size={13} className="text-primary" />
                                        Now Serving
                                    </span>
                                    <span className="font-mono font-bold text-white bg-primary px-3 py-1 rounded-lg text-xs">
                                        {liveData.currentTokenCode || "-"}
                                    </span>
                                </div>
                            </div>

                            {/* Queue status warning */}
                            {liveData.status !== "open" && (
                                <div className="mt-4 text-center text-xs text-warning bg-amber-50 py-2 rounded-lg border border-warning/25 animate-pulse capitalize">
                                    ⚠️ Queue is currently {liveData.status}
                                </div>
                            )}

                            {/* Auto-update notice */}
                            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
                                <MdOutlineAutorenew size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                                Updates automatically in real-time
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back to home */}
                <a href="/" className="flex items-center gap-1.5 mt-6 text-sm text-accent hover:text-primary transition-colors">
                    <IoIosArrowBack size={16} />
                    Back to Home
                </a>

            </motion.div>
        </div>
    );
};

export default TokenTracker;