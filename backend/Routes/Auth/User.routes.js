import express from "express"
import { loginUser, registerUser } from "../../Controllers/Auth/User.controllers.js"

const router = express.Router()

// route to register a user - /api/user/register
router.post("/register", registerUser)

// route to login a user - /api/user/login
router.post("/login", loginUser)


export default router