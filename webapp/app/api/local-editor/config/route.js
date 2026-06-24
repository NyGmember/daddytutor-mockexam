import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseYaml } from '@/lib/yaml';

export async function GET() {
  // Security check: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const configPath = path.join(process.cwd(), '..', 'configuration.md');
    
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'configuration.md not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    
    // Extract YAML frontmatter
    const match = fileContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!match) {
      return NextResponse.json({ error: 'YAML frontmatter not found in configuration.md' }, { status: 500 });
    }
    
    const configObj = parseYaml(match[1]);
    const subjects = configObj?.system_config?.subjects || [];

    return NextResponse.json({
      success: true,
      subjects
    });

  } catch (error) {
    console.error('Error in config API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
