import HookflowModel from "../db/models/Hookflow/Hookflow.model.js"
import { sendResponse } from "../utils/index.js"
import crypto from "crypto"

// create a hookflow
export const createHookflow = async (req, res) => {
    const { webhookName, isHookActive, integration, pipeline, delivery } = req.body
    const { userId } = req.user
    const webhookPath = crypto.randomUUID()
    const webhookSecret = crypto.randomBytes(32).toString("hex")
    try {
        // check if webhook name is already taken
        const existingHookflow = await HookflowModel.findOne({ webhookName, userId }) // this will throw 400 error if webhook name is already taken by same user
        if (existingHookflow) return sendResponse(res, 400, false, "Webhook name already taken")

        // create new hookflow
        const hookflow = new HookflowModel({ userId, webhookName, webhookPath, webhookSecret, isHookActive, integration, pipeline, delivery })

        await hookflow.save()
        return sendResponse(res, 201, true, "New Hookflow created!")

    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}

// get all hookflows
export const getAllHookflows = async (req, res) => {

    try {
        const hookflows = await HookflowModel.find({ userId: req.user.userId });

        return sendResponse(res, 200, true, "Hookflows retrieved", { hookflows });
    } catch (error) {
        return sendResponse(res, 500, false, error.message);
    }
}
