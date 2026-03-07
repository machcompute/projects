import { NextResponse } from "next/server";
import { projects } from "@/app/lib/projects";

export function GET() {
  return NextResponse.json(projects);
}
