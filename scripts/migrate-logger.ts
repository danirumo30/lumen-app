#!/usr/bin/env node

/**
 * Migrates console.* calls to structured logger in API routes.
 */

import { readFileSync, writeFileSync } from 'fs';
import { relative } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);

const projectRoot = process.cwd();
const apiPath = `${projectRoot}/src/app/api`;
const loggerImport = "import { logger } from '@/lib/logger';";

const consolePatterns = [
  { pattern: /console\.log\s*\(/g, replacement: 'logger.debug(' },
  { pattern: /console\.warn\s*\(/g, replacement: 'logger.warn(' },
  { pattern: /console\.error\s*\(/g, replacement: 'logger.error(' },
];

function processFile(filePath, dryRun = false) {
  const original = readFileSync(filePath, 'utf-8');
  let content = original;

  if (!content.includes(loggerImport)) {
    const useClientIdx = content.indexOf("'use client'");
    if (useClientIdx !== -1) {
      const insertPos = useClientIdx + ("'use client'").length;
      content = content.slice(0, insertPos) + `\n${loggerImport}` + content.slice(insertPos);
    } else {
      content = `${loggerImport}\n${content}`;
    }
  }

  for (const { pattern, replacement } of consolePatterns) {
    content = content.replace(pattern, replacement);
  }

  if (content === original) {
    return { changed: false };
  }

  if (!dryRun) {
    writeFileSync(filePath, content, 'utf-8');
  }

  return { changed: true };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log(`🔍 Finding API route files...`);
  const files = await glob('**/*.{ts,tsx}', { cwd: apiPath, absolute: true });
  
  console.log(`📁 Found ${files.length} files to process`);
  
  let totalChanged = 0;
  for (const file of files) {
    const relPath = relative(projectRoot, file);
    const { changed } = processFile(file, dryRun);
    if (changed) {
      totalChanged++;
      console.log(`✅ ${relPath}`);
    }
  }
  
  console.log(`\n📊 Summary: ${totalChanged} files ${dryRun ? 'would be' : ''} changed`);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
