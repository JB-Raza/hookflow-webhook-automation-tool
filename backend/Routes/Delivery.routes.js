import express from "express"
import { createDelivery, getAllDeliveries } from "../Controllers/Delivery.controllers.js"
import { validateWebhookPayload } from "../utils/middlewares/validateWebhookPayload.js"
import { authenticateUser } from "../utils/index.js"


const router = express.Router()

router.post("/:webhookPath/create/", validateWebhookPayload, createDelivery)
router.get("/:hookflowId/", authenticateUser, getAllDeliveries)

export default router