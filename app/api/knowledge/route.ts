import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'knowledge.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(fileContent));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const articles = await req.json();
    const filePath = path.join(process.cwd(), 'data', 'knowledge.json');
    fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
