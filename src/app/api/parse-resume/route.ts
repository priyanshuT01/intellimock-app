import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Gets the FormData from the request
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Forwards the request to the Python API
    // Note: Flask backend expects 'resume' as the key name
    const externalFormData = new FormData();
    externalFormData.append("resume", file);

    const response = await fetch("http://localhost:5000/parse-resume", {
      method: "POST",
      body: externalFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to parse resume", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Parse resume error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

