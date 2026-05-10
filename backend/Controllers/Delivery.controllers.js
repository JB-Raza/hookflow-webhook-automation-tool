import HookflowModel from "../db/models/Hookflow/Hookflow.model.js"
import DeliveryModel from "../db/models/Hookflow/Delivery.model.js"
import { sendResponse } from "../utils/index.js"


// creating a delivery

export const createDelivery = async (req, res) => {
    const { webhookPath } = req.params
    const rawPayload = req.body
    try {
        // check if webhook exists
        const existingWebhook = await HookflowModel.findOne({ webhookPath: webhookPath })

        if (!existingWebhook || !existingWebhook.isHookActive) return sendResponse(res, 404, false, "The requsted webhook url doesn't exist or is not active")

        // create new delivery
        const newDelivery = new DeliveryModel({ hookflowId: existingWebhook._id, rawPayload })
        await newDelivery.save()
        return sendResponse(res, 201, true, "Delivery created successfully")

    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}