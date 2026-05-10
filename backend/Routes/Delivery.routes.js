import express from "express"
import { createDelivery } from "../Controllers/Delivery.controllers.js"
import { validateWebhookPayload } from "../utils/middlewares/validateWebhookPayload.js"


const router = express.Router()

router.post("/:webhookPath/create/", validateWebhookPayload, createDelivery)

export default router