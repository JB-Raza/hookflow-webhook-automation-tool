import HookflowModel from "../db/models/Hookflow/Hookflow.model.js"
import DeliveryModel from "../db/models/Hookflow/Delivery.model.js"
import { sendResponse, validateObjectId, verifyHookflowOwnership } from "../utils/index.js"
import { hookflowSchema } from "../SchemaValidation/HookflowSchema.validation.js"
import crypto from "crypto"

// create a hookflow
export const createHookflow = async (req, res) => {
    const { webhookName, isHookActive, integration, pipeline, delivery } = req.body
    const { userId } = req.user
    const webhookPath = crypto.randomUUID()
    const webhookSecret = crypto.randomBytes(32).toString("hex")
    try {
        // data schema validation
        const validation = hookflowSchema.safeParse(req.body);
        if (!validation.success) {
            const errMsg = JSON.parse(validation.error.message)[0].message
            return sendResponse(res, 400, false, errMsg);
        }
        // check if webhook name is already taken
        const existingHookflow = await HookflowModel.findOne({ webhookName, userId }) // this will throw 400 error if webhook name is already taken by same user
        if (existingHookflow) return sendResponse(res, 400, false, "Webhook name already taken")

        // create new hookflow
        const hookflow = new HookflowModel({ userId, webhookName, webhookPath, webhookSecret, isHookActive, integration, pipeline, delivery })

        await hookflow.save()
        return sendResponse(res, 201, true, "New Hookflow created!", { hookflow })

    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}

// update a hookflow by id
export const updateHookflowById = async (req, res) => {
    const { id } = req.params
    const { webhookName, isHookActive, integration, pipeline, delivery } = req.body
    try {
        if(!validateObjectId(id)) return sendResponse(res, 400, false, "Invalid hookflow id")
        const checkOwnership = await verifyHookflowOwnership(id, req, res)
        if (!checkOwnership.isOwner) return sendResponse(res, checkOwnership.status, false, checkOwnership.message)

        // data validation
        const validation = hookflowSchema.safeParse(req.body);
        if (!validation.success) {
            const errMsg = JSON.parse(validation.error.message)[0].message
            return sendResponse(res, 400, false, errMsg);
        }
        const updatedHookflow = await HookflowModel.findByIdAndUpdate(id, { webhookName, isHookActive, integration, pipeline, delivery }, { new: true })
        return sendResponse(res, 200, true, "Hookflow updated", { updatedHookflow })
    } catch (error) {
        return sendResponse(res, error.statusCode || 500, false, error.message)
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

// get hookflow by id
export const getHookflowById = async (req, res) => {
    const { id } = req.params
    try {
        if(!validateObjectId(id)) return sendResponse(res, 400, false, "Invalid hookflow id")
        const checkOwnership = await verifyHookflowOwnership(id, req, res)
        if (!checkOwnership.isOwner) return sendResponse(res, checkOwnership.status, false, checkOwnership.message)

        return sendResponse(res, 200, true, "Hookflow retrieved", { hookflow: checkOwnership.hookflow })
    } catch (error) {
        return sendResponse(res, error.statusCode || 500, false, error.message)
    }
}

// delete a hookflow by id
export const deleteHookflowById = async (req, res) => {
    const { id } = req.params
    try {
        if(!validateObjectId(id)) return sendResponse(res, 400, false, "Invalid hookflow id")
        const checkOwnership = await verifyHookflowOwnership(id, req, res)
        if (!checkOwnership.isOwner) return sendResponse(res, checkOwnership.status, false, checkOwnership.message)
        
        await HookflowModel.findByIdAndDelete(id)
        await DeliveryModel.deleteMany({ hookflowId: id })

        return sendResponse(res, 200, true, "Hookflow deleted along with its deliveries")
    } catch (error) {
        return sendResponse(res, error.statusCode || 500, false, error.message)
    }
}

// toggle isHookflowActive
export const toggleHookflowActiveStatus = async (req, res) => {
    const { id } = req.params
    const { isHookActive } = req.body
    try {
        if(!validateObjectId(id)) return sendResponse(res, 400, false, "Invalid hookflow id")
        const checkOwnership = await verifyHookflowOwnership(id, req, res)
        if (!checkOwnership.isOwner) return sendResponse(res, checkOwnership.status, false, checkOwnership.message)

        const updatedHookflow = await HookflowModel.findByIdAndUpdate(id, { isHookActive }, { new: true })
        return sendResponse(res, 200, true, "status updated", { updatedHookflow })
    } catch (error) {
        return sendResponse(res, error.statusCode || 500, false, error.message)
    }
}
