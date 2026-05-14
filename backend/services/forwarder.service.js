
// transforming the payload into readable format through AI
export async function transformRawPayload(payload) {
    return payload
}

// forwarding the transformed payload to the reciever destination
export async function forwardTransformedPayloadToDest(destWebhookUrl, transformedPayload) {
    const response = await fetch(destWebhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedPayload)
    })
    const rawText = await response.text()
    if (!response.ok) {
        throw new Error(`Failed to forward the transformed payload to the destination. Status: ${response.status}. Response: ${rawText}`)
    }
    let parsedData;
    try {
        parsedData = JSON.parse(rawText)
    } catch (error) {
        parsedData = rawText
    }
    return {
        status: response.status,
        data: parsedData
    }
}