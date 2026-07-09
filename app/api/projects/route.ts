import { NextRequest, NextResponse } from "next/server";
import { saveProject, listProjects } from "@/lib/db";
import { GeneratedProject } from "@/types/project";

export async function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(request: NextRequest) {
  const { project } = (await request.json()) as { project: GeneratedProject };
  if (!project?.id) {
    return NextResponse.json({ error: "A valid project is required." }, { status: 400 });
  }
  saveProject(project);
  return NextResponse.json({ ok: true });
}
