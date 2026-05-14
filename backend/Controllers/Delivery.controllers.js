import HookflowModel from "../db/models/Hookflow/Hookflow.model.js"
import DeliveryModel from "../db/models/Hookflow/Delivery.model.js"
import { sendResponse, validateObjectId, verifyHookflowOwnership } from "../utils/index.js"
import { forwardTransformedPayloadToDest, transformRawPayload } from "../services/index.js"


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
export const getAllDeliveriesWithLimit = async (req, res) => {
    const { hookflowId } = req.params
    // implement pagination
    // const { page = 1, limit  } = req.query // here i will be getting string so i need to parse them into int
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skipDeliveries = (page - 1) * limit
    try {
        if (!validateObjectId(hookflowId)) return sendResponse(res, 400, false, "Invalid hookflow id")

        const checkOwnership = await verifyHookflowOwnership(hookflowId, req, res)
        if (!checkOwnership.isOwner) return sendResponse(res, checkOwnership.status, false, checkOwnership.message)

        const deliveries = await DeliveryModel.find({ hookflowId }).sort({ createdAt: -1 }).skip(skipDeliveries).limit(limit)

        return sendResponse(res, 200, true, "Deliveries retrieved successfully", { deliveries })
    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}


// get single delivery details
export const getSingleDeliveryDetails = async (req, res) => {
    const { hookflowId, deliveryId } = req.params
    try {
        if (!validateObjectId(hookflowId)) return sendResponse(res, 400, false, "Invalid Hookflow id")

        const checkOwnership = await verifyHookflowOwnership(hookflowId, req, res)
        if (!checkOwnership.isOwner) return sendResponse(res, checkOwnership.status, false, checkOwnership.message)

        if (!validateObjectId(deliveryId)) return sendResponse(res, 400, false, "Invalid delivery id")

        const deliveryItem = await DeliveryModel.findOne({ _id: deliveryId })
        if (!deliveryItem) return sendResponse(res, 404, false, "Delivery doesn't exist with given ID")

        return sendResponse(res, 200, true, "Delivery retrieved successfully", { deliveryItem })
    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}

