import { sendResponse } from "../index.js"

export const validateWebhookPayload = (req, res, next) => {
    try {
        const data = req.body
        const { webhookPath } = req.params

        if (!data) return sendResponse(res, 400, false, "No data Provided", data)

        if (!webhookPath || webhookPath.trim().length < 4) return sendResponse(res, 400, false, "Invalid or no hook url provided", webhookPath)

        next()
    }
    catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}
