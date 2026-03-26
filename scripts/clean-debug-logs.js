#!/usr/bin/env node

/**
 * Aggressive debug log cleanup.
 * Keeps only business/event logs and errors/warnings.
 * Comments out everything else.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const apiPath = path.join(projectRoot, 'src', 'app', 'api');

const keepPatterns = [
  /token\s+expired/i,
  /Cache\s+hit/i,
  /email/i, // business emails
  /verificad/i,
  /confirmad/i,
  /restablecimiento/i,
  /[Ee]rror/i,
  /[Ww]arn/i,
  /[Ii]nfo\s*:/, // info with colon perhaps important
  /Found\s+users/i,
  /refresh/i,
  /deleted/i,
  /saved/i,
  /created/i,
  /updated/i,
  /inserted/i,
];

// REMOVABLE patterns (debug noise)
const removablePatterns = [
  /^\[DEBUG\]/,
  /^\[Debug\]/,
  /final\s+URL/i,
  /called\s+with/i,
  /queryBody/i,
  /Detected\s+browser\s+language/i,
  /response\s+status/i,
  /Translation\s+complete/i,
  /data\s+type/i,
  /count:/i,
  /total:/i,
  /sorted/i,
  /providers\s+with/i,
  /^\[[A-Z_]+\]$/, // Generic tags like [SEARCH], [GAMES], etc.
];

function shouldRemove(line) {
  if (!line.includes('logger.debug(')) return false;
  
  // If line matches any keep pattern, DO NOT remove
  const lowerLine = line.toLowerCase();
  for (const pattern of keepPatterns) {
    if (pattern.test(lowerLine)) return false;
  }
  
  return true;
}

function processFile(filePath, dryRun = false) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const lines = original.split('\n');
  const newLines = [];
  let changed = false;
  let removedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (shouldRemove(line)) {
      changed = true;
      removedCount++;
      newLines.push(`// DEBUG REMOVED: ${line}`);
    } else {
      newLines.push(line);
    }
  }

  if (!changed) return { changed: false };

  if (!dryRun) {
    fs.writeFileSync(filePath, newLines.join('\n') + '\n', 'utf-8');
  }

  return { changed: true, removedCount };
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !['migrate-logger.ts', 'clean-debug-logs.js'].includes(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log('🔍 Scanning API routes for debug cleanup...');
  const files = getAllFiles(apiPath);
  
  console.log(`📁 Processing ${files.length} files`);
  
  let totalChanged = 0;
  let totalRemoved = 0;
  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    try {
      const { changed, removedCount } = processFile(file, dryRun);
      if (changed) {
        totalChanged++;
        totalRemoved += removedCount;
        console.log(`✅ ${relPath} (-${removedCount})`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${relPath}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary: ${totalChanged} files modified, ${totalRemoved} debug logs removed`);
  if (!dryRun) {
    console.log('\n💡 Run `npm run lint` and `npx tsc --noEmit` to verify.');
  }
}

main();

