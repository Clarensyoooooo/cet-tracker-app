import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server" // Import this

export async function POST(request: Request) {
  // --- ADD THIS SECURITY CHECK ---
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // -------------------------------

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

export async function POST(request: Request) {
  try {
    const { image } = await request.json() // Expecting a base64 image string

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // You need the multimodal model
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this image. If it contains university admission details, extract them into this JSON structure: { application_start, application_end, exam_dates: [{date, note}], results_release, exam_fee, requirements: [] }. Use null for missing info." 
            },
            {
              type: "image_url",
              image_url: {
                url: image, // Pass the base64 string here
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    })

    const data = JSON.parse(response.choices[0].message.content || "{}")
    return NextResponse.json(data)
  } catch (error) {
    console.error("AI Parse error:", error)
    return NextResponse.json({ error: "Failed to parse image" }, { status: 500 })
  }
}