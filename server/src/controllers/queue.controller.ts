import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { Queue } from "../models/Queue.model";
import { ApiError } from "../utils/ApiError";
import { Settings } from "../models/Setting.model";
import { ApiResponse } from "../utils/ApiResponse";
import { Appointment } from "../models/Appointment.model";
import { getAvailableDates, getTodayQueue, issueToken } from "../services/queue.service";

/**_____________________________________________________________________________________________________________

 * @route POST /api/queue/init
 * @desc  Initialize today's queue - called one each motning by assistant
 * _____________________________________________________________________________________________________________
*/
export const initQueue = asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent double initialization
    const existingQueue = await Queue.findOne({ date: today });
    if (existingQueue) {
        throw new ApiError(409, "Today's queue has already been initialized");
    }

    // Read current setting
    // This way changing settings mid-day doesn't break the current queue
    const settings = await Settings.findOne();
    if (!settings) {
        throw new ApiError(500, "Settings not configured. Please set up dispensary settings first!")
    }

    const queue = await Queue.create({
        date: today,
        maxLimit: settings.maxDailyLimit,
        openningTime: settings.openningTime,
        avgConsultationMinutes: settings.avgConsultationMinutes,
        currentToken: 0,
        lastToken: 0,
        status: "open",
    });

    res.status(201).json(
        new ApiResponse("Queue initialized successfully", queue)
    );
});


/**_____________________________________________________________________________________________________________

 * @route GET /api/queue/today
 * @desc  Get today's queue state + full appointment list
 * _____________________________________________________________________________________________________________
*/
export const getTodayQueueData = asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const queue = await Queue.findOne({ date: today });

    //  Get all appointments for today sorted by token number
    const appointments = await Appointment.find({
        date: { $gte: today, $lte: endOfDay },
    }).populate("patientId", "name phone allergies").sort({ tokenNumber: 1 });

    res.status(200).json(
        new ApiResponse("Today's queue fetched", { queue, appointments })
    );
});


/**_____________________________________________________________________________________________________________

 * @route GET /api/queue/live
 * @desc  Minimal live data - no auth (used by /live-board and /track)
 * _____________________________________________________________________________________________________________
*/
export const getLiveQueue = asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const queue = await Queue.findOne({ date: today });

    if (!queue) {
        res.status(200).json(
            new ApiResponse("Queue not initialized", {
                currentToken: 0,
                waitingCount: 0,
                status: "closed",
                nextTokens: [],
            })
        );
        return;
    }

    // Get waiting appointments for "Up Next" display on live board
    const waitingAppointments = await Appointment.find({
        date: { $gte: today, $lte: endOfDay },
        status: "waiting",
    })
        .sort({ tokenNumber: 1 }).limit(5).select("tokenCode tokenNumber estimatedTime");

    const waitingCount = await Appointment.countDocuments({
        date: { $gte: today, $lte: endOfDay },
        status: "waiting",
    });

    res.status(200).json(
        new ApiResponse("Live queue data fetched", {
            currentToken: queue.currentToken,
            currentTokenCode: queue.currentToken > 0
                ? `T-${String(queue.currentToken).padStart(3, "0")}`
                : null,
            waitingCount,
            status: queue.status,
            nextTokens: waitingAppointments
        })
    );
});


/**_____________________________________________________________________________________________________________

 * @route POST /api/queue/token
 * @desc  Issue a token - creates an appointment for the given date
 * _____________________________________________________________________________________________________________
*/
export const issueQueueToken = asyncHandler(async (req: Request, res: Response) => {
    const { patientId, date, type, notes } = req.body;

    console.log(patientId, date, type);


    if (!patientId || !date || !type) {
        throw new ApiError(400, "patientId, date , and type are required");
    }

    if (!["online", "manual"].includes(type)) {
        throw new ApiError(400, "type must be online or manual");
    }

    const appointment = await issueToken({
        patientId,
        date: new Date(date),
        type,
        bookedBy: req.user!._id,
        notes
    });

    // populate patient info for response
    await appointment.populate("patientId", "name phone");

    // TODO phase 9: trigger n8n webhook for booking confirmation
    // await triggerN8n("booking_confirmed", { ... })

    res.status(201).json(
        new ApiResponse("Token issued successfully", appointment)
    );
})


/**_____________________________________________________________________________________________________________

 * @route PUT /api/queue/next
 * @desc  Advance queue to next token
 * _____________________________________________________________________________________________________________
*/
export const advanceQueue = asyncHandler(async (req: Request, res: Response) => {
    const queue = await getTodayQueue();

    if (queue.status !== "open") {
        throw new ApiError(400, `Cannot advance queue - current status is : ${queue.status}`)
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    //  Mark current appointment as completed
    if (queue.currentToken > 0) {
        await Appointment.findOneAndUpdate(
            {
                date: { $gte: today, $lte: endOfDay },
                tokenNumber: queue.currentToken,
                status: "serving"
            },
            { status: "completed" }
        );
    }

    // Find next waiting appointment
    const nextAppointment = await Appointment.findOne({
        date: { $gte: today, $lte: endOfDay },
        status: "waiting",
    }).sort({ tokennumber: 1 }).populate("patientId", "name phone allergies");

    if (!nextAppointment) {
        // No more waiting patients - close the queue
        queue.status = "closed";
        await queue.save();

        //Emit socket event
        const io = req.app.get("io");
        if (io) {
            io.emit("queue: closed", {
                message: "All patients have been seen.Queue is now closed."
            });
        }

        res.status(200).json(
            new ApiResponse("No more waiting patients.Queue is closed.", queue)
        );
        return;
    }

    // Set next appointment as serving
    nextAppointment.status = "serving";
    await nextAppointment.save();

    // Update queue current token
    queue.currentToken = nextAppointment.tokenNumber;
    await queue.save();

    // Get updated waiting count
    const waitingCount = await Appointment.countDocuments({
        date: { $gte: today, $lte: endOfDay },
        status: "waiting",
    });

    // Get all today's appointments for socket payload
    const allAppointments = await Appointment.find({
        date: { $gte: today, $lte: endOfDay },
    }).populate("patientId", "name phone").sort({ tokenNumber: 1 });

    // Emit real time update to all connected clients
    const io = req.app.get("io");
    if (io) {
        io.emit("queue:updated", {
            currentToken: queue.currentToken,
            waitingCount,
            queue: allAppointments
        });
    }

    res.status(200).json(
        new ApiResponse("Queue advanced successfully", {
            queue,
            currentAppointment: nextAppointment,
            waitingCount,
        })
    );
});

/**_____________________________________________________________________________________________________________

 * @route PUT /api/queue/pause
 * @desc  Pause the queue
 * _____________________________________________________________________________________________________________
*/
export const pauseQueue = asyncHandler(async (req: Request, res: Response) => {
    const queue = await getTodayQueue();

    if (queue.status !== "open") {
        throw new ApiError(400, `Queue is already ${queue.status}`);
    }

    queue.status = "paused";
    await queue.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
        io.emit("queue:paused", {
            message: "Queue os temporarily pauses.Please wait.",
        });
    }

    res.status(200).json(new ApiResponse("Queue paused", queue));
})


/**_____________________________________________________________________________________________________________

 * @route PUT /api/queue/resume
 * @desc  Resume a paused queue
 * _____________________________________________________________________________________________________________
*/
export const resumeQueue = asyncHandler(async (req: Request, res: Response) => {
    const queue = await getTodayQueue();

    if (queue.status !== "paused") {
        throw new ApiError(400, "Queue is not paused");
    }

    queue.status = "open";
    await queue.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const waitingCount = await Appointment.countDocuments({
        date: { $gte: today, $lte: endOfDay },
        status: "waiting",
    });

    const allAppointments = await Appointment.countDocuments({
        date: { $gte: today, $lte: endOfDay },
    }).populate("patientId", "name phone").sort({ tokenNumber: 1 });

    // Emit socket event - clients resume listening
    const io = req.app.get("io");
    if (io) {
        io.emit("queue:updated", {
            currentToken: queue.currentToken,
            waitingCount,
            queue: allAppointments,
        });
    }

    res.status(200).json(new ApiResponse("Queue resumed", queue))

})


/**_____________________________________________________________________________________________________________

 * @route PUT /api/queue/close
 * @desc  Close queue for the day
 * _____________________________________________________________________________________________________________
*/
export const closeQueue = asyncHandler(async (req: Request, res: Response) => {
    const queue = await getTodayQueue();

    if (queue.status === "closed") {
        throw new ApiError(400, "Queue is already closed");
    }

    queue.status = "closed";
    await queue.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
        io.emit("queue:closed", {
            message: "The dispensary is now closed for today. Thank you."
        });
    }

    res.status(200).json(new ApiResponse("Queue closed for the day", queue));
});


/**_____________________________________________________________________________________________________________

 * @route PUT /api/queue/available-dates
 * @desc  Get available booking dates for patient booking form
 * _____________________________________________________________________________________________________________
*/
export const getAvailableBookingDates = asyncHandler(async (req: Request, res: Response) => {
    const dates = await getAvailableDates();
    res.status(200).json(
        new ApiResponse("Available dates fetched", dates)
    );
});