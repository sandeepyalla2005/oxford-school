// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS })
    }

    try {
        const { recipients, message, senderId, templateId, messageType, entityId } = await req.json()

        const authKey = Deno.env.get("MSG91_AUTH_KEY")
        const dltEntityId = Deno.env.get("MSG91_ENTITY_ID") || entityId || ""
        const dltTemplateId = Deno.env.get("MSG91_TEMPLATE_ID") || templateId || ""

        if (!authKey) {
            return new Response(JSON.stringify({ success: false, error: "Missing MSG91_AUTH_KEY" }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
        }

        // Build the payload for v5/flow API
        const smsEntries = recipients.map((r: any) => {
            let body = message || ""
            body = body.replace(/\{\{name\}\}/gi, r.name || "")
                .replace(/\{\{class\}\}/gi, r.class || "")
                .replace(/\{\{admission\}\}/gi, r.admissionNumber || "")
                .replace(/\{\{fees\}\}/gi, r.pendingFees || "")
                .replace(/\{\{phone\}\}/gi, r.targetPhone || "")

            let phone = r.targetPhone.replace(/\D/g, '')
            if (phone.length === 10) phone = '91' + phone

            return {
                to: [phone],
                message: body
            }
        })

        const payload: any = {
            template_id: dltTemplateId, // In Flow API, this is the MSG91 Template ID
            short_url: "0",
            sender: senderId || "Oxford",
            sms: smsEntries
        }

        // Critical for India DLT
        if (dltEntityId) payload.pe_id = dltEntityId

        const response = await fetch("https://api.msg91.com/api/v5/flow/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authkey": authKey
            },
            body: JSON.stringify(payload)
        })

        const result = await response.json()
        console.log("MSG91 Log:", JSON.stringify(result))

        return new Response(JSON.stringify({ success: true, result }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }
})
