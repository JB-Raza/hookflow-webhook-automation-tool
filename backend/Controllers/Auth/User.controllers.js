import UserModel from "../../db/models/User/User.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import "dotenv/config"
import { sendResponse } from "../../utils/index.js"

// register user controller
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        // check if user already exists
        const existingUser = await UserModel.findOne({ email })
        if (existingUser) return sendResponse(res, 400, false, "User already exists")


        const hashedPassword = await bcrypt.hash(password, 10)
        // create new user
        const user = new UserModel({ name, email, password: hashedPassword })
        await user.save()

        return sendResponse(res, 201, true, "user created successfully!")
    } catch (error) {
        return sendResponse(res, 500, false, error?.message)
    }
}

// login user controller
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        // check if user exists
        const user = await UserModel.findOne({ email })
        if (!user) return sendResponse(res, 400, false, "User not found")
        // check if password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) return sendResponse(res, 400, false, "Invalid Password!")

        const { password: storedUserPassword, ...userData } = user._doc
        // generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
        return sendResponse(res, 200, true, "Login successful", { userData, token })

    } catch (error) {
        return sendResponse(res, 500, false, error?.message)

    }
}