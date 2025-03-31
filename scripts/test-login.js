#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Function to prompt for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const promptInput = (question) => {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
};

// Main function
async function main() {
  console.log(chalk.cyan('🔐 Supabase Direct Login Test Tool'));
  console.log(chalk.yellow('This tool will test login credentials directly against your Supabase instance\n'));
  
  // Determine which environment to use
  const envType = await promptInput('Use production environment? (y/n): ');
  const useProduction = envType.toLowerCase() === 'y';
  
  // Load the appropriate environment variables
  const envFile = useProduction ? '.env.proddb' : '.env.local';
  dotenv.config({ path: join(rootDir, envFile) });
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(chalk.red(`\n❌ Missing environment variables in ${envFile}`));
    console.error('Please make sure these variables are defined:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    rl.close();
    return;
  }
  
  console.log(chalk.green(`\nUsing environment: ${useProduction ? 'PRODUCTION' : 'LOCAL'}`));
  console.log(`Supabase URL: ${supabaseUrl}\n`);
  
  // Get login credentials
  let email = await promptInput('Email (default: prod@example.com): ');
  if (!email) email = 'prod@example.com';
  
  let password = await promptInput('Password (default: password123): ');
  if (!password) password = 'password123';
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log(chalk.yellow('\nAttempting to sign in...\n'));
  
  try {
    // Sign out first to clear any existing sessions
    await supabase.auth.signOut();
    
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error(chalk.red('❌ Login failed:'));
      console.error(`Error code: ${error.status}`);
      console.error(`Message: ${error.message}`);
      console.error('\nFull error object:');
      console.error(error);
      
      console.log(chalk.yellow('\nPossible solutions:'));
      console.log('1. Verify that the email and password are correct');
      console.log('2. Check if the user exists in this environment');
      console.log('3. Try creating a new user in the Supabase dashboard');
      console.log('4. Verify auth settings in the Supabase dashboard');
      console.log('5. Ensure Email auth provider is enabled in Supabase');
    } else {
      console.log(chalk.green('✅ Login successful!'));
      console.log('\nUser info:');
      console.log(`ID: ${data.user.id}`);
      console.log(`Email: ${data.user.email}`);
      console.log(`Created at: ${new Date(data.user.created_at).toLocaleString()}`);
      
      console.log(chalk.green('\nAuthentication is working correctly!'));
    }
  } catch (e) {
    console.error(chalk.red('❌ Exception during login:'));
    console.error(e);
  } finally {
    rl.close();
  }
}

main(); 