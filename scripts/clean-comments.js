#!/usr/bin/env node

/**
 * Cleanup: Remove Spanish comments, commented code, and debug remnants
 * Keeps: JSDoc comments, legal comments, English technical comments
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Patterns to REMOVE completely
const removeLinePatterns = [
  /^\s*\/\/.*[áéíóúñÁÉÍÓÚ]/,       // Spanish single-line comments
  /^\s*\/\*.*[áéíóúñÁÉÍÓÚ].*\*\/\s*$/, // Spanish multi-line (single line)
  /^\s*\/\/\s*DEBUG REMOVED:/,      // Our commented debug logs
  /^\s*\/\/\s*console\.(log|warn|error)/, // Old console statements commented
  /^\s*\/\/\s*$/,                  // Empty comment lines (just //)
];

// Patterns that indicate a block of commented code
const isCommentedCode = /^\s*\/\*\s*$|\/\/\s*[\w\.]+\s*\(/;

function shouldRemoveLine(line) {
  for (const pattern of removeLinePatterns) {
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
    
    if (shouldRemoveLine(line)) {
      changed = true;
      removedCount++;
      continue; // Skip this line
    }
    
    if (line.trim().startsWith('/*') && !line.includes('*/')) {
      // Multi-line comment start - could be code
      let inBlock = true;
      let blockLines = [line];
      let j = i + 1;
      while (j < lines.length && inBlock) {
        blockLines.push(lines[j]);
        if (lines[j].includes('*/')) {
          inBlock = false;
          i = j; // Skip ahead
        }
        j++;
      }
      // Heuristic: if block contains code patterns (function, const, let, class, etc) and is short (<15 lines), remove
      const blockText = blockLines.join('\n');
      const looksLikeCode = /function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|class\s+\w+/i.test(blockText);
      const linesCount = blockLines.length;
      if (looksLikeCode && linesCount < 15) {
        changed = true;
        removedCount += linesCount;
        continue;
      }
      // Otherwise keep it (maybe real comment)
      newLines.push(...blockLines);
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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      // Skip node_modules, .next, etc.
      if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log('🔍 Scanning source files for Spanish comments and commented code...');
  const files = getAllTsFiles(projectRoot);
  
  console.log(`📁 Found ${files.length} files to process`);
  
  let totalChanged = 0;
  let totalRemoved = 0;
  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    try {
      const { changed, removedCount } = processFile(file, dryRun);
      if (changed) {
        totalChanged++;
        totalRemoved += removedCount;
        console.log(`✅ ${relPath} (-${removedCount} lines)`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${relPath}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary: ${totalChanged} files cleaned, ${totalRemoved} lines removed`);
}

main();

