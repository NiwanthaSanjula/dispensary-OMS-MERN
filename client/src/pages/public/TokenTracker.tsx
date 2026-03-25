import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import queueService, { type LiveQueueResponse } from '../../api/services/queue.service';

import { MdOutlineAutorenew } from "react-icons/md"
import { IoIosArrowBack } from "react-icons/io"

/**
 * Toekn tracker - /track
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

    /**
     * Calculate position from live data
     * How many "waiting" token are ahead of the tracked token
     */
    const getPosition = (): number | null => {
        if (!liveData || !trackedToken) return null;

        const trackedNumber = parseInt(trackedToken.replace("T-", ""));
        const currentToken = liveData.currentToken;

        //  Count waiting tokens with lower number than ours
        const ahead = liveData.nextTokens.filter(
            (t) => t.tokenNumber < trackedNumber
        ).length;

        if (trackedNumber <= currentToken) return 0; // Already called or passed
        return ahead;
    };

    /*
    * Track a token - fetch current live data
    */
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
            setError("Could not detch queue data. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    //  Update live data on socket events
    useEffect(() => {
        if (!socket || !trackedToken) return;

        const hanldeQueueUpdate = async () => {
            try {
                const data = await queueService.getLive();
                setLiveData(data);
            } catch (error) {/* ignore */ }
        };

        socket.on("queue:updated", hanldeQueueUpdate);
        socket.on("queue:closed", hanldeQueueUpdate);
        socket.on("queue:paused", hanldeQueueUpdate);

        return () => {
            socket.off("queue:updated", hanldeQueueUpdate);
            socket.off("queue:closed", hanldeQueueUpdate);
            socket.off("queue:paused", hanldeQueueUpdate);
        }

    }, [socket, trackedToken]);

    const position = getPosition();
    const trackedNumber = liveData?.nextTokens
        ? parseInt(trackedToken.replace("T-", ""))
        : null


    // Find estimated time for tracked token from nextToken
    const trackedInfo = liveData?.nextTokens.find(
        (t) => t.tokenNumber === trackedNumber
    );

    return (
        <div className='min-h-screen bg-gray-bg flex flex-col items-center justify-center px-4'>

            <div className='w-full max-w-sm shadow-md p-6'>

                { /* Header */}
                <div className='text-center mb-8'>
                    <h1 className='text-4xl font-BabesNeue text-dark mb-1'>
                        Track Your Token
                    </h1>
                    <p className='text-gray-text text-sm'>
                        Enter your token code to see your queue position
                    </p>

                    {/* Connection indicator */}
                    <div className='flex items-center justify-center gap-2 mt-2'>

                        <div />
                        <span>
                            {isConnected ? "Live" : "Connecting"}
                        </span>
                    </div>
                </div>

                {/* Token Input */}
                <div className='card mb-4'>
                    <label className='input-label'>Token Code</label>
                    <div className='flex flex-col gap-2'>
                        <input
                            type="text"
                            className='input-field font-mono uppercase'
                            placeholder='T-013'
                            value={tokenInput}
                            maxLength={5}
                            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                        />
                        <button
                            onClick={handleTrack}
                            disabled={isLoading || !tokenInput}
                            className='btn-primary px-5 whitespace-nowrap'
                        >
                            {isLoading ? "Checking..." : "Track Token"}
                        </button>
                    </div>

                    {error && (
                        <p className='text-danger text-xs mt-2'>{error}</p>
                    )}
                </div>

                {/* Result Card */}
                {trackedToken && liveData && (
                    <div className='card border-2 border-primary'>

                        {/* Your token */}
                        <div className='text-center mb-4'>
                            <p className='text-gray-text text-xs uppercase tracking-wider mb-1'>
                                Your Token
                            </p>
                            <p className='font-mono font-bold text-dark text-4xl'>
                                {trackedToken}
                            </p>
                        </div>

                        {/* Position */}
                        <div
                            className={``}
                        >
                            {position === 0 ? (
                                <div className='flex flex-col items-center justify-center gap-2 mb-4 border rounded-lg border-primary py-2 animate-pulse'>
                                    <p className='text-primary font-bold text-lg'>
                                        It's your turn!
                                    </p>
                                    <p className='text-primary-dark text-sm'>
                                        Please proceed to the doctor
                                    </p>
                                </div>
                            ) : position !== null ? (
                                <div className='flex flex-col items-center justify-center gap-2 mb-4 border rounded-lg border-gray-400 py-2'>
                                    <p className='text-3xl font-bold text-dark'>{position}</p>
                                    <p className='text-gray-text text-sm mt-1'>
                                        {position === 1 ? "patient" : "patients"} ahead of you
                                    </p>
                                </div>
                            ) : (
                                <p className='text-gray-text text-sm'>
                                    Position unavailable
                                </p>
                            )}
                        </div>

                        {/* Estimated Time */}
                        {trackedInfo && (
                            <div className='flex items-center justify-between text-sm border-t border-gray-border pt-3'>
                                <span className='text-gray-text'>Estimated Time</span>
                                <span className='text-dark font-bold font-mono bg-gray-200 px-2 py-1 rounded w-full max-w-20 text-center'>{trackedInfo.estimatedTime}</span>
                            </div>
                        )}

                        {/* Now Serving */}
                        <div className='flex items-center justify-between text-sm mt-2'>
                            <span className='text-gray-text'>Now Serving</span>
                            <span className='font-mono font-bold text-white w-full max-w-20 text-center bg-primary px-2 py-1 rounded'>
                                {liveData.currentTokenCode || "-"}
                            </span>
                        </div>

                        {/* Queue status */}
                        {liveData.status !== "open" && (
                            <div className='mt-3 text-center text-xs text-warning bg-amber-50 py-2 rounded-lg border border-warning/25 animate-pulse'>
                                Queue is currently {liveData.status}
                            </div>
                        )}

                        {/* Auto-update notice */}
                        <p className='text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2'>
                            <MdOutlineAutorenew size={20} />
                            Updates automatically in real-time
                        </p>

                    </div>
                )}

                {/* Back to home */}
                <p className='flex items-center gap-2 text-center mt-6 text-accent text-sm'>
                    <IoIosArrowBack />
                    <a href="/">
                        Back to Home
                    </a>
                </p>



            </div>
        </div>
    )
}

export default TokenTracker