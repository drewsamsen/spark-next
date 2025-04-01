#!/usr/bin/env node

/**
 * Inngest Migration Helper Script
 * 
 * This script helps migrate from the old monolithic inngest.config.ts to the new modular structure.
 * It doesn't modify any files itself, but provides a clear checklist of what functions have been migrated
 * and what remains to be done.
 * 
 * Usage: node scripts/migrate-inngest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Check if old inngest.config.ts still exists
const oldConfigPath = path.join(projectRoot, 'inngest.config.ts');
const oldConfigExists = fs.existsSync(oldConfigPath);

// Get a list of all implemented functions in the modular structure
const implementedFunctions = [];

// Directories to check for implemented functions
const functionDirs = [
  path.join(projectRoot, 'src/inngest/functions/readwise'),
  path.join(projectRoot, 'src/inngest/functions/airtable'),
  path.join(projectRoot, 'src/inngest/functions/tags'),
];

// Function to extract exported function names from a file
function extractExportedFunctions(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const exportMatches = content.match(/export\s+const\s+(\w+)/g) || [];
  return exportMatches.map(match => match.replace(/export\s+const\s+/, ''));
}

// Check each function directory
functionDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.ts') && file !== 'index.ts') {
        const filePath = path.join(dir, file);
        const functions = extractExportedFunctions(filePath);
        implementedFunctions.push(...functions);
      }
    });
  }
});

// Get a list of all functions in the old config
let oldFunctions = [];
if (oldConfigExists) {
  const oldConfig = fs.readFileSync(oldConfigPath, 'utf8');
  const exportMatches = oldConfig.match(/export\s+const\s+(\w+Fn)\s+=\s+inngest\.createFunction/g) || [];
  oldFunctions = exportMatches.map(match => 
    match.replace(/export\s+const\s+/, '').replace(/\s+=\s+inngest\.createFunction/, '')
  );
}

// Get a list of what's implemented in the route file
const routePath = path.join(projectRoot, 'src/app/api/inngest/route.ts');
let routeFunctions = [];
if (fs.existsSync(routePath)) {
  const routeContent = fs.readFileSync(routePath, 'utf8');
  
  // Extract imports
  const importMatch = routeContent.match(/import\s+{([^}]+)}\s+from\s+["']@\/inngest["']/);
  if (importMatch && importMatch[1]) {
    routeFunctions = importMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s && s !== 'inngest');
  }
  
  // Also check for uncommented functions in the functions array
  const functionsArrayMatch = routeContent.match(/functions\s*:\s*\[([\s\S]*?)\]/);
  if (functionsArrayMatch && functionsArrayMatch[1]) {
    const uncommentedFunctions = functionsArrayMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('//'));
    
    routeFunctions.push(...uncommentedFunctions);
  }
}

console.log('\nInngest Migration Status');
console.log('======================\n');

console.log(`Old config file (inngest.config.ts): ${oldConfigExists ? 'Still exists' : 'Removed'}`);
console.log(`Total functions in old config: ${oldFunctions.length}`);
console.log(`Functions implemented in new structure: ${implementedFunctions.length}`);
console.log(`Functions registered in route handler: ${routeFunctions.length}\n`);

console.log('Migration Progress:');
if (oldFunctions.length > 0) {
  console.log('\nFunctions from old config:');
  oldFunctions.forEach(fn => {
    const implemented = implementedFunctions.includes(fn);
    const registered = routeFunctions.includes(fn);
    console.log(`- ${fn}: ${implemented ? '✅ Implemented' : '❌ Not implemented'} | ${registered ? '✅ Registered' : '❌ Not registered'}`);
  });
}

if (implementedFunctions.length > 0) {
  console.log('\nFunctions in new structure:');
  implementedFunctions.forEach(fn => {
    console.log(`- ${fn}: ${routeFunctions.includes(fn) ? '✅ Registered in route' : '❌ Not registered in route'}`);
  });
}

console.log('\nNext Steps:');
if (oldConfigExists) {
  const remainingFunctions = oldFunctions.filter(fn => !implementedFunctions.includes(fn));
  if (remainingFunctions.length > 0) {
    console.log(`1. Migrate the following ${remainingFunctions.length} functions:`);
    remainingFunctions.forEach(fn => console.log(`   - ${fn}`));
    console.log('2. Update route.ts to register newly migrated functions.');
    console.log('3. Re-run this script to check progress.');
    console.log('4. When all functions are migrated, remove inngest.config.ts.');
  } else {
    console.log('All functions have been migrated! You can now:');
    console.log('1. Remove the old inngest.config.ts file');
    console.log('2. Make sure all functions are registered in src/app/api/inngest/route.ts');
  }
} else {
  console.log('Migration complete! All functions have been moved to the new structure.');
}

console.log('\n'); 