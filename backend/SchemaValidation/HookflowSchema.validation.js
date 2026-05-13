import { z } from "zod"

export const hookflowSchema = z.object({
    webhookName: z.string().trim().min(4, "Hookflow Name must be  4 or more characters!"),
    isHookActive: z.boolean().optional(),
    integration: z.object({
        provider: z.string().trim().min(1, "provider is required for integration"),
    }),
    delivery: z.object({
        destination: z.string().trim().min(1, "provider is required for integration"),
        destinationWebhookUrl: z.url("Invalid webhook url provided"),
    }),
    // pipeline: z.object({
    //     type: z.string().trim().min(1, "pipeline type is required"),
    //     rules: z.array(z.object({
    //         field: z.string().trim().min(1, "field is required"),
    //         operator: z.string().trim().min(1, "operator is required"),
    //         value: z.string().trim().min(1, "value is required"),
    //     })),
    // }),
})