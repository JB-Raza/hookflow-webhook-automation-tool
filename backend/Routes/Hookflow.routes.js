import express from "express"
import { createHookflow, getAllHookflows } from "../Controllers/Hookflow.controllers.js"
import { authenticateUser } from "../utils/index.js"

const router = express.Router()


router.get("/", authenticateUser, getAllHookflows)
router.post("/create", authenticateUser, createHookflow)

export default router