#!/usr/bin/env node

/**
 * Migrates console.* calls to structured logger in API routes.
 * Pure Node.js - no external dependencies.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const apiPath = path.join(projectRoot, 'src', 'app', 'api');
const loggerImport = "import { logger } from '@/lib/logger';";

// Pattern to match console.* calls
const consolePatterns = [
  { regex: /console\.log\s*\(/g, replacement: 'logger.debug(' },
  { regex: /console\.warn\s*\(/g, replacement: 'logger.warn(' },
  { regex: /console\.error\s*\(/g, replacement: 'logger.error(' },
];

/**
 * Recursively get all .ts/.tsx files in directory
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Process a single file
 */
function processFile(filePath, dryRun = false) {
  const original = fs.readFileSync(filePath, 'utf-8');
  let content = original;

  // Add logger import if not present
  if (!content.includes(loggerImport)) {
    const useClientIdx = content.indexOf("'use client'");
    if (useClientIdx !== -1) {
      const insertPos = useClientIdx + "'use client'".length;
      content = content.slice(0, insertPos) + `\n${loggerImport}` + content.slice(insertPos);
    } else {
      content = `${loggerImport}\n${content}`;
    }
  }

  // Replace console.* calls
  for (const { regex, replacement } of consolePatterns) {
    content = content.replace(regex, replacement);
  }

  if (content === original) {
    return { changed: false };
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { changed: true };
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (!fs.existsSync(apiPath)) {
    console.error(`❌ API directory not found: ${apiPath}`);
    process.exit(1);
  }
  
  console.log(`🔍 Scanning API routes...`);
  const files = getAllFiles(apiPath);
  
  console.log(`📁 Found ${files.length} files to process`);
  
  let totalChanged = 0;
  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    try {
      const { changed } = processFile(file, dryRun);
      if (changed) {
        totalChanged++;
        console.log(`✅ ${relPath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${relPath}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary: ${totalChanged} files ${dryRun ? 'would be' : ''} changed out of ${files.length}`);
}

main();
