import HookflowModel from "../db/models/Hookflow/Hookflow.model.js"
import DeliveryModel from "../db/models/Hookflow/Delivery.model.js"
import { sendResponse } from "../utils/index.js"


// creating a delivery
export const createDelivery = async (req, res) => {
    const { webhookPath } = req.params
    const rawPayload = req.body
    try {
        // check if webhook exists
        const existingWebhookRecord = await HookflowModel.findOne({ webhookPath: webhookPath })

        if (!existingWebhookRecord) return sendResponse(res, 404, false, "The requsted webhook url doesn't exist.")
        if (!existingWebhookRecord.isHookActive) return sendResponse(res, 403, false, "The requsted webhook url is not active.")

        // create new delivery
        const newDelivery = new DeliveryModel({ hookflowId: existingWebhookRecord._id, rawPayload })
        await newDelivery.save()

        setImmediate(async () => {
            // forward the delivery to the destination
            try {
                await DeliveryModel.findByIdAndUpdate(newDelivery._id, {
                    $set: { deliveryStatus: "forwarding" },
                    $inc: { attemptsToDestinationCount: 1 },
                })

                const destWebhookUrl = existingWebhookRecord.delivery.destinationWebhookUrl
                const transformedPayload = transformRawPayload(rawPayload)
                const result = await forwardTransformedPayloadToDest(destWebhookUrl, transformedPayload)
                console.log("result", result)
                await DeliveryModel.findByIdAndUpdate(newDelivery._id, {
                    deliveryStatus: "completed",
                    receiverResponseStatusCode: result.status,
                    receiverResponseBody: result.data,
                })

            } catch (error) {
                await DeliveryModel.findByIdAndUpdate(newDelivery._id, {
                    $set: {
                        deliveryStatus: "failed_permanently",
                        errorMessage: error?.message || "something went wrong while forwarding the delivery to the destination",
                    },
                    $inc: { attemptsToDestinationCount: 1 },
                })
            }
        })

        return sendResponse(res, 201, true, "Delivery created successfully")

    } catch (error) {
        return sendResponse(res, error?.statusCode || 500, false, error?.message)
    }
}


// get all deliveries. this will be used to maintain history of deliveries for a specific hookflow
export const getAllDeliveries = async (req, res) => {
    const { hookflowId } = req.params
    try {
        const deliveries = await DeliveryModel.find({ hookflowId })
            .sort({ createdAt: -1 })
        return sendResponse(res, 200, true, "Deliveries retrieved successfully", { deliveries })
    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}


// transforming the payload into readable format through AI
function transformRawPayload(payload) {
    console.log("payload transformed")
    return payload
}

// forwarding the transformed payload to the reciever destination
async function forwardTransformedPayloadToDest(destWebhookUrl, transformedPayload) {
    const response = await fetch(destWebhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedPayload)
    })
    const rawText = await response.text()
    if (!response.ok) {
        throw new Error(`Failed to forward the transformed payload to the destination. Status: ${response.status}. Response: ${rawText}`)
    }
    let parsedData;
    try {
        parsedData = JSON.parse(rawText)
    } catch (error) {
        parsedData = rawText
    }
    return {
        status: response.status,
        data: parsedData
    }
}
