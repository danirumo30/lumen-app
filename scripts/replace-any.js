#!/usr/bin/env node

/**
 * Replace all remaining `any` type annotations with `unknown`
 * This satisfies the TypeScript rule: no implicit any
 * Note: This is a stopgap; proper types should be added later.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

function replaceAnyInFile(content) {
  let changed = false;
  
  // Replace ': any' with ': unknown'
  let newContent = content.replace(/:\s*any\b/g, ': unknown');
  
  // Replace 'any[]' with 'unknown[]'
  newContent = newContent.replace(/\bany\s*\[\s*\]/g, 'unknown[]');
  
  // Replace 'Array<any>' with 'Array<unknown>'
  newContent = newContent.replace(/Array<\s*any\s*>/g, 'Array<unknown>');
  
  if (newContent !== content) {
    changed = true;
  }
  
  return { content: newContent, changed };
}

function processFile(filePath, dryRun = false) {
  const original = fs.readFileSync(filePath, 'utf-8');
  const { content: newContent, changed } = replaceAnyInFile(original);
  
  if (!changed) return { changed: false };
  
  if (!dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
  
  return { changed: true };
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !filePath.includes('node_modules') && !filePath.includes('.next') && !file.includes('scripts/replace-any')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log('🔍 Scanning for remaining any type annotations...');
  const files = getAllTsFiles(projectRoot);
  
  console.log(`📁 Files: ${files.length}`);
  
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
      console.error(`❌ ${relPath}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 ${totalChanged} files modified to replace any → unknown`);
  if (!dryRun) {
    console.log('\n💡 Run `npx tsc --noEmit` and `npm run lint` to verify.');
  }
}

main();
