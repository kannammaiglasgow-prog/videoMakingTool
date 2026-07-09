import { NextRequest, NextResponse } from "next/server";
import { mockGenerateProject } from "@/lib/mockAi";
import { generateScriptAndScenes } from "@/lib/scriptAgent";
import { GenerateInput } from "@/types/project";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateInput;

  if (!body.text || !body.text.trim()) {
    return NextResponse.json({ error: "Text input is required." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(mockGenerateProject(body));
  }

  try {
    const project = await generateScriptAndScenes(body);
    return NextResponse.json(project);
  } catch (err) {
    console.error("Gemini generation failed, falling back to mock:", err);
    const project = mockGenerateProject(body);
    project.generationWarning =
      "AI generation failed, showing a mock preview instead. " +
      (err instanceof Error ? err.message : "Unknown error.");
    return NextResponse.json(project);
  }
}
