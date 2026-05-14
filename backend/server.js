import express from "express"
import cors from "cors" // setting up the cors so that frontend can send requests to backend
import "dotenv/config" // setting up dotenv so that i could use .env file private vars
import mongoConnect from "./db/connection.js"
import authRoutes from "./Routes/Auth/User.routes.js"
import hookflowRoutes from "./Routes/Hookflow.routes.js"
import deliveryRoutes from "./Routes/Delivery.routes.js"
import { sendResponse } from "./utils/index.js"



const app = express()

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

// routes
app.use("/api/user", authRoutes)
app.use("/api/hookflow", hookflowRoutes)
app.use("/delivery", deliveryRoutes)

// 404 fallback
app.use((req, res) => {
    return sendResponse(res, 404, false, "This route doesn't exist")
})





// error handler fallback
app.use((err, req, res, next) => {
    console.error("Global Error Handler Trace:", err.stack);

    // to handle duplicate key storage in mongodb
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return sendResponse(res, 400, false, `${field} already exists. Please use another.`);
    }

    if (err.name == "JsonWebTokenError") return sendResponse(res, 401, false, "Invalid token signature.");


    const statusCode = err.statusCode || 500
    const message = err.message || "Internal server error..."
    return sendResponse(res, statusCode, false, message)
})






mongoConnect()
    .then(() => {
        app.listen(process.env.SERVER_PORT, () => {
            console.log(`Server is running on port ${process.env.SERVER_PORT}`)
        });
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB", error)
        process.exit(1)
    })

