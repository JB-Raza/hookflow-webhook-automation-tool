export const sendResponse = (res, statusCode, success, message, data = null) => {
    const response = {
        success,
        message: message == "" ? "" : message
    };

    // Only include data if it's provided
    if (data) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};
