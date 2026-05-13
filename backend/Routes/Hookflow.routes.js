import express from "express"
import { createHookflow, deleteHookflowById, getAllHookflows, getHookflowById, updateHookflowById, toggleHookflowActiveStatus } from "../Controllers/Hookflow.controllers.js"
import { authenticateUser } from "../utils/index.js"

const router = express.Router()


router.get("/", authenticateUser, getAllHookflows)
router.post("/create", authenticateUser, createHookflow)
router.get("/:id/", authenticateUser, getHookflowById) // id = hookflow id
router.put("/:id/", authenticateUser, updateHookflowById) // id == hookflow id
router.delete("/:id/", authenticateUser, deleteHookflowById) // id == hookflow id
router.patch("/:id/toggle", authenticateUser, toggleHookflowActiveStatus) // id == hookflow id

export default router