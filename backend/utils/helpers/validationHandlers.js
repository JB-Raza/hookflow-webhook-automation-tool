import mongoose from "mongoose"

export const validateObjectId = (objectId) => {
    return mongoose.Types.ObjectId.isValid(objectId)
}