import mongoose from "mongoose"
const { Schema } = mongoose


const deliverySchema = new Schema({
    hookflowId: { type: Schema.Types.ObjectId, ref: 'Hookflow', required: true, index: true },
    rawPayload: { type: Object },
    processedPayloadForDestination: { type: Object },

    // Delivery to reciever
    deliveryStatus: {
        type: String,
        enum: ['received', 'forwarding', 'completed', 'failed_permanently', 'retrying'],
        default: 'received' // received: the delivery has been received by the hookflow, forwarding: the delivery is being forwarded to the destination, completed: the delivery has been completed successfully, failed_permanently: the delivery has failed permanently, retrying: the delivery is being retried
    },
    attemptsToDestinationCount: { type: Number, default: 0 }, // number of attempts taken forward the delivery to the destination - if the delivery fails, we will increment this count
    // Receiver Response Info
    receiverResponseStatusCode: { type: Number }, // the status code of the response from the destination
    receiverResponseBody: { type: Object }, // the body of the response from the destination
    errorMessage: { type: String } // the error message if the delivery fails
}, { timestamps: true });


const DeliveryModel = mongoose.model('Delivery', deliverySchema)
export default DeliveryModel