import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  // 1. SECURITY: Check if the user is an Admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. Initialize OpenAI inside the function (Prevents build crashes if key is missing)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 3. Get Data (Handle both Text or Image inputs)
    const body = await request.json()
    const { image, text } = body

    if (!image && !text) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 })
    }

    // 4. Build the AI Prompt
    const userMessageContent: any[] = [
      { 
        type: "text", 
        text: "Extract university admission details into this JSON structure: { application_start, application_end, exam_dates: [{date, note}], results_release, exam_fee, requirements: [] }. Use null for missing info." 
      }
    ]

    if (image) {
      userMessageContent.push({
        type: "image_url",
        image_url: { url: image }
      })
    } else if (text) {
      userMessageContent.push({
        type: "text",
        text: `\n\nAnalyze this text: ${text}`
      })
    }

    // 5. Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use gpt-4o for best image/text understanding
      messages: [
        {
          role: "user",
          content: userMessageContent,
        },
      ],
      response_format: { type: "json_object" },
    })

    const data = JSON.parse(response.choices[0].message.content || "{}")
    return NextResponse.json(data)

  } catch (error) {
    console.error("AI Parse error:", error)
    return NextResponse.json({ error: "Failed to parse" }, { status: 500 })
  }
}