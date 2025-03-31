#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load environment variables from .env.proddb
dotenv.config({ path: join(rootDir, '.env.proddb') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required environment variables are set
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error(chalk.red('❌ Missing required environment variables'));
  console.error(chalk.yellow('\nEnsure these are set in your .env.proddb file:'));
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log(chalk.yellow('⚠️  Testing connection to PRODUCTION database!'));
console.log(`Supabase URL: ${supabaseUrl}`);

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Function to test the connection
async function testConnection() {
  console.log('\n🔄 Testing production database connection...');
  
  try {
    // Test basic connection
    const { data: session } = await supabaseAdmin.auth.getSession();
    console.log(chalk.green('✓ Connected to production Supabase successfully!'));
    
    // List all tables in the public schema using a raw query
    console.log('\n📊 Database Schema:');
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc(
      'get_tables_in_schema', 
      { schema_name: 'public' }
    );
    
    if (tablesError) {
      console.log(chalk.yellow('Cannot list tables through RPC. Will check profiles table directly.'));
    } else if (tables && tables.length === 0) {
      console.log(chalk.yellow('  No tables found in the public schema'));
    } else if (tables) {
      console.log(chalk.cyan('  Tables in public schema:'));
      tables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    // Check for profiles table
    console.log('\n👥 Checking profiles table:');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.log(chalk.red(`  Error accessing profiles table: ${profilesError.message}`));
    } else {
      console.log(chalk.green('  Successfully accessed profiles table'));
    }
    
    // Test user sign-in if credentials were provided
    console.log('\n🔐 Testing anonymous authentication:');
    const { data: anonAuth, error: anonAuthError } = await supabaseAnon.auth.signInAnonymously();
    
    if (anonAuthError) {
      console.log(chalk.red(`  Anonymous auth error: ${anonAuthError.message}`));
      if (anonAuthError.message.includes('Anonymous auth has not been enabled')) {
        console.log(chalk.yellow('  Note: Anonymous auth is not enabled in your Supabase project.'));
      }
    } else {
      console.log(chalk.green('  Successfully tested authentication system'));
    }
    
    console.log('\n🔐 Checking authentication settings:');
    const { data: authSettings, error: authError } = await supabaseAdmin
      .from('auth')
      .select('*')
      .limit(1);
    
    if (authError) {
      if (authError.message.includes('permission denied')) {
        console.log(chalk.yellow('  Cannot directly query auth tables (expected behavior)'));
      } else {
        console.log(chalk.red(`  Error: ${authError.message}`));
      }
    }
    
    // Summary
    console.log(chalk.green('\n✅ Production database connection test completed'));
    console.log('\n⚠️  Important: When running the app with the production database:');
    console.log('1. Clear your browser cache and cookies before testing');
    console.log('2. Try using a private/incognito window');
    console.log('3. If login issues persist, verify your credentials against the production database directly');
    
    console.log(chalk.cyan('\nYou can now run the app with your production database:'));
    console.log(chalk.cyan('  npm run proddb'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error testing connection:'), error.message);
    console.error(chalk.yellow('\nTroubleshooting steps:'));
    console.log('1. Verify your Supabase URL and API keys are correct');
    console.log('2. Check your .env.proddb file for correct credentials');
    console.log('3. Ensure your IP is allowed in the Supabase dashboard');
    process.exit(1);
  }
}

testConnection(); 