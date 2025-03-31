#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fs from 'fs';
import dotenv from 'dotenv';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log(chalk.cyan('🔄 Starting Next.js with production database connection...'));
console.log(chalk.yellow('⚠️  Note: This is connecting to your PRODUCTION database!'));
console.log(chalk.yellow('⚠️  Be careful with any operations that modify data.'));

// Load environment variables from .env.proddb
const envPath = join(rootDir, '.env.proddb');
console.log(chalk.cyan(`Loading environment from: ${envPath}`));

if (!fs.existsSync(envPath)) {
  console.error(chalk.red(`❌ Error: ${envPath} not found!`));
  console.error(chalk.yellow('Please create this file with your production Supabase credentials.'));
  process.exit(1);
}

// Load the prod env file
const prodEnv = dotenv.config({ path: envPath }).parsed || {};

console.log('\n');

// Build environment with production variables explicitly set
const env = {
  ...process.env,
  NODE_ENV: 'development',
  NEXT_PUBLIC_USING_PROD_DB: 'true',
  // Explicitly set the Supabase variables
  NEXT_PUBLIC_SUPABASE_URL: prodEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: prodEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: prodEnv.SUPABASE_SERVICE_ROLE_KEY
};

// Show values being used
console.log(chalk.cyan('Using the following Supabase configuration:'));
console.log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`ANON KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[SET]' : '[MISSING]'}`);
console.log(`SERVICE KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[MISSING]'}`);

// Run Next.js with the production DB environment
const nextDev = spawn('next', ['dev'], {
  env,
  stdio: 'inherit',
  shell: true,
  cwd: rootDir
});

// Handle process events
nextDev.on('close', (code) => {
  if (code !== 0) {
    console.log(chalk.red(`\n⛔ Process exited with code ${code}`));
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit(0);
}); 