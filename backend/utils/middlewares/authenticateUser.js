
import { sendResponse } from "../helpers/responseHandlers.js"
import jwt from "jsonwebtoken"
import "dotenv/config"


export const authenticateUser = (req, res, next) => {
    const { accessToken } = req.headers

    if (!accessToken) return sendResponse(res, 401, false, "Unauthorized access denied! user not authenticated!")

    try {
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET)
        if (!decodedToken) return sendResponse(res, 401, false, "token is invalid or expired")

        req.user = { userId: decodedToken.userId }
    } catch (error) {
        return sendResponse(res, 401, false, "Token is invalid or expired.");
    }
    next()
}