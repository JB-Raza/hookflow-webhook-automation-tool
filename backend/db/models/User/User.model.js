import mongoose from "mongoose"
const { Schema } = mongoose

const userSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
})

const UserModel = mongoose.model('User', userSchema)
export default UserModel