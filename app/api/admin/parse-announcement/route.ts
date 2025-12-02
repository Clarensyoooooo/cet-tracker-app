import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  // 1. SECURITY: Check if the user is an Admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
    // 'gemini-1.5-flash' is fast, cheap/free, and good at extraction
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // 3. Get Data
    const body = await request.json()
    const { image, text } = body

    if (!image && !text) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 })
    }

    // 4. Build the Prompt
    const prompt = `
      You are a data extraction assistant for a university application tracker.
      Extract the following details from the provided text or image.
      Return ONLY a valid JSON object. Do not use Markdown formatting (no \`\`\`json).
      
      JSON Structure:
      {
        "application_start": "string or null",
        "application_end": "string or null",
        "exam_dates": [{ "date": "string", "note": "string" }],
        "results_release": "string or null",
        "exam_fee": "string or null",
        "requirements": ["string"]
      }

      If information is missing, use null.
    `

    // 5. Generate Content
    let result;
    if (image) {
      // Handle Image (Base64)
      // The frontend likely sends "data:image/png;base64,..."
      // Gemini expects just the base64 string and the mime type
      const base64Data = image.split(",")[1]
      const mimeType = image.split(":")[1].split(";")[0]
      
      result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: mimeType } }
      ])
    } else {
      // Handle Text
      result = await model.generateContent([prompt, text])
    }

    const responseText = result.response.text()
    
    // Clean up potential markdown formatting if the model adds it
    const cleanJson = responseText.replace(/```json|```/g, "").trim()
    const data = JSON.parse(cleanJson)

    return NextResponse.json(data)

  } catch (error) {
    console.error("AI Parse error:", error)
    return NextResponse.json({ error: "Failed to parse" }, { status: 500 })
  }
}