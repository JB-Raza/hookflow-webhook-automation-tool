import mongoose from "mongoose"
import "dotenv/config"


const mongoConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to database")
    } catch (error) {
        console.log("Error connecting to MongoDB", error)
        process.exit(1)
    }

}
export default mongoConnect