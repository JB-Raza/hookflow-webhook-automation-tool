import HookflowModel from "../../db/models/Hookflow/Hookflow.model.js";

// validate if authenticated user is trying to access his own hooflows

export const verifyHookflowOwnership = async (id, req, res) => {

    try {
        if (!id) return { isOwner: undefined, status: 404, message: "Hookflow id not provided" }
        console.log("id ---- ", typeof id);

        const hookflow = await HookflowModel.findById(id)

        if (!hookflow) return { isOwner: undefined, status: 404, message: "Hookflow not found" }
        if (!hookflow.userId.equals(req.user.userId)) return { isOwner: false, status: 403, message: "You are not authorized to update this hookflow" }

        return { isOwner: true, status: 200, message: "Hookflow ownership verified", hookflow }
    } catch (error) {
        return { isOwner: undefined, status: error.status || 500, message: error.message }
    }

}