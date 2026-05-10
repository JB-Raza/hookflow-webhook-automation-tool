import express from "express"
import cors from "cors" // setting up the cors so that frontend can send requests to backend
import "dotenv/config" // setting up dotenv so that i could use .env file private vars
import mongoConnect from "./db/connection.js"
import authRoutes from "./Routes/Auth/User.routes.js"
import hookflowRoutes from "./Routes/Hookflow.routes.js"
import deliveryRoutes from "./Routes/Delivery.routes.js"



const app = express()

app.use(express.json())
app.use(cors())

// routes
app.use("/api/user", authRoutes)
app.use("/api/hookflow", hookflowRoutes)
app.use("/api/delivery", deliveryRoutes)


mongoConnect()
    .then(() => {
        app.listen(process.env.SERVER_PORT, () => {
            console.log("Server is running on port 3000")
        });
    })
    .catch((error) => {
        console.log("Error connecting to MongoDB", error)
        process.exit(1)
    })
