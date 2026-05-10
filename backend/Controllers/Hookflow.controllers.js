import HookflowModel from "../db/models/Hookflow/Hookflow.model.js"
import { sendResponse } from "../utils/index.js"

// create a hookflow
export const createHookflow = async (req, res) => {
    const { userId, webhookName, webhookPath, webhookSecret, isHookActive, integration, pipeline, delivery } = req.body

    try {
        // check if webhook name is already taken
        const existingHookflow = await HookflowModel.findOne({ webhookName })
        if (existingHookflow) return sendResponse(res, 400, false, "Webhook name already taken")


        if (!webhookPath || webhookPath.trim().length < 4 || webhookPath.includes(" ")) {
            return sendResponse(res, 400, false, "Webhook path is required and must be at least 4 characters long and cannot contain spaces")
        }

        const existingWebhookPath = await HookflowModel.findOne({ webhookPath })
        if (existingWebhookPath) return sendResponse(res, 400, false, "Webhook path already exists")

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
