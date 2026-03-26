#!/usr/bin/env node

/**
 * Remove non-essential comments (clean code principle)
 * Keeps: JSDoc (/***), license headers, TODOs/FIXMEs, regex explanations
 * Removes: Obvious "what" comments, redundant line comments
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Comment patterns to REMOVE (these are noise)
const removeCommentPatterns = [
  /^\s*\/\/\s*(Get|Fetch|Build|Create|Handle|Validate|Check|Update|Set|Initialize|Process|Generate|Construct|Build array|Build query|Build URL|Build params|Build request|Make|Call|Invoke|Open|Close|Read|Write|Parse|Format|Convert|Transform|Map|Filter|Reduce|Loop through|Iterate)/i,
  /^\s*\/\/\s*(If|When|While|For|Switch|Case|Default|Try|Catch|Finally|Return|Throw|Break|Continue)/i,
  /^\s*\/\/\s*(Declare|Define|Assign|Set variable|Create variable|Let|Const)/i,
  /^\s*\/\/\s*(import|export|from|require)/i,
  /^\s*\/\/\s*[\w\s]{1,30}$/, // Very short generic comments (< 30 chars after //)
  /^\s*\/\/\s*$/, // Empty comment
];

// Patterns to KEEP (essential)
const keepPatterns = [
  /\/\*\*/,                    // JSDoc start
  /\* eslint/,                 // ESLint directives
  /\* @ts-ignore/,             // TS ignore
  /@TODO|@FIXME|TODO|FIXME/,   // Action items
  /regex|pattern/i,            // Explaining regex
  /workaround|hack|temporary/i, // Important context
];

function shouldRemoveComment(line) {
  for (const pattern of keepPatterns) {
    if (pattern.test(line)) return false;
  }

  // Check if it matches removal patterns
  for (const pattern of removeCommentPatterns) {
    if (pattern.test(line)) return true;
  }

  return false;
}

function processFile(filePath, dryRun = false) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const lines = original.split('\n');
  const newLines = [];
  let changed = false;
  let removedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let keepLine = true;

    if (line.match(/^\s*\/\//)) {
      if (shouldRemoveComment(line)) {
        keepLine = false;
      }
    }

    // Check block comment lines (not JSDoc/**)
    if (line.match(/^\s*\/\*/) && !line.match(/^\s*\/\*\*/)) {
      // Could be start of block comment. We'll handle inline, but for multi-line we need state
      // We'll skip for now since they're rarer; handle inline only
    }

    if (!keepLine) {
      changed = true;
      removedCount++;
      continue;
    }

    newLines.push(line);
  }

  if (!changed) return { changed: false };

  if (!dryRun) {
    fs.writeFileSync(filePath, newLines.join('\n') + '\n', 'utf-8');
  }

  return { changed: true, removedCount };
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log('🔍 Scanning for non-essential comments...');
  const files = getAllTsFiles(projectRoot);
  
  console.log(`📁 Files: ${files.length}`);
  
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
      console.error(`❌ ${relPath}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Cleaned ${totalChanged} files, removed ${totalRemoved} non-essential comments.`);
}

main();

