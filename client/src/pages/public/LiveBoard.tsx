import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import queueService, { type LiveQueueResponse } from '../../api/services/queue.service';

const LiveBoard = () => {

    const { socket } = useSocket();

    const [liveData, setLiveData] = useState<LiveQueueResponse | null>(null);
    const [time, setTime] = useState(new Date());
    const [message, setMessage] = useState<string>("");

    //  Fetch initial live data
    useEffect(() => {
        const fetchLive = async () => {
            try {
                const data = await queueService.getLive();
                setLiveData(data);

                console.log(data);


            } catch (error) {
                // Silently fail - will retry on socket event
            }
        };
        fetchLive();
    }, []);

    // Live clock - updates every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer)
    }, []);

    //  Socket.io listners
    useEffect(() => {
        if (!socket) return;

        //  Queue advanced - update serving token
        socket.on("queue:updated", async () => {
            try {
                const data = await queueService.getLive();
                setLiveData(data);
                setMessage("");
            } catch {/* Ignore err */ }
        });

        //  Queue paused
        socket.on("queue:paused", (data: { message: string }) => {
            setMessage(data.message);
        });

        //  Queue closed
        socket.on("queue:closed", (data: { message: string }) => {
            setMessage(data.message);
        });

        return () => {
            socket.off("queue:updated");
            socket.off("queue:paused");
            socket.off("queue:closed");
        };

    }, [socket]);

    const formattedTime = time.toLocaleDateString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })

    return (
        <div className='min-h-screen bg-dark flex flex-col items-center justify-center text-white px-8 select-none'>

            {/* Dispensary Name */}
            <h2 className='text-primary tracking-wider text-4xl font-BabesNeue uppercase mb-12' >Dispensary</h2>

            {/* Pause / Close message */}
            {message && (
                <div className='mb-8 px-6 py-3 bg-warning/20 text-warning rounded-xl text-center text-lg'>
                    {message}
                </div>
            )}

            {/* NOW SERVING label */}
            <p className='text-white text-base tracking-[0.4em] uppercase mb-4'>
                NOW SERVING
            </p>

            {/* Current Token - MASSIVE */}
            <div
                className="font-BabesNeue font-bold text-primary leading-none tracking-wider mb-12"
                style={{
                    fontSize: 'clamp(100px, 20vw, 220px)',
                    textShadow: "0 0 60px rgba(51, 204, 51, 0.4)",
                }}
            >
                {liveData?.currentTokenCode
                    ? liveData.currentTokenCode
                    : liveData?.status === "closed" ? "CLOSED" : "_"
                }
            </div>

            {/* Divider */}
            <div className='w-full max-w-2xl border-t border-white/10 mb-10' />

            {/* Up Next section */}
            {liveData?.nextTokens && liveData.nextTokens.length > 0 && (
                <>
                    <p className='text-white/30 tracking-widest uppercase mb6'>
                        UP NEXT
                    </p>

                    <div className='flex items-center gap-8 mb-12'>
                        {liveData.nextTokens.map((token) => (
                            <div key={token._id} className='text-center'>
                                <p className='font-mono font-bold text-white mt-1'>
                                    {token.tokenCode}
                                </p>
                                <p className='text-white/30 mt-1'>
                                    Estimated Time: {token.estimatedTime}
                                </p>
                            </div>
                        ))}
                    </div>
                </>

            )}
            {/* waiting count */}
            {liveData && (
                <p className='text-white/30 mb-12'>
                    {liveData.waitingCount} patient{liveData.waitingCount !== 1 ? "s" : ""} waiting
                </p>
            )}

            {/* Bottom Stripe */}
            <div className='absolute bottom-0 left-0 right-0 px-8 py-4  flex items-center justify-between font-BabesNeue text-2xl border-t border-white/10'>
                <p className='text-primary uppercase tracking-widest'>Dispensary Name</p>
                <p className=''>{formattedTime}</p>
            </div>



        </div>
    )
}

export default LiveBoard