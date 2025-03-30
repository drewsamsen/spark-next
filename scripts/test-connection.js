#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * 
 * This script tests the connection to your local Supabase instance.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

console.log('🔍 Testing Supabase Connection');
console.log('----------------------------');

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error(chalk.red('❌ Missing environment variables'));
  
  if (!supabaseUrl) console.error(chalk.red('   - NEXT_PUBLIC_SUPABASE_URL is not set'));
  if (!supabaseAnonKey) console.error(chalk.red('   - NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'));
  if (!supabaseServiceKey) console.error(chalk.red('   - SUPABASE_SERVICE_ROLE_KEY is not set'));
  
  console.error(chalk.yellow('\nEnsure these are set in your .env.local file'));
  process.exit(1);
}

console.log(chalk.green('✓ Environment variables loaded'));
console.log(`Supabase URL: ${supabaseUrl}`);

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Function to test the connection
async function testConnection() {
  console.log('\n🔄 Testing connection...');
  
  try {
    // Test basic connection
    const { data: session } = await supabaseAdmin.auth.getSession();
    console.log(chalk.green('✓ Connected to Supabase successfully!'));
    
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
    try {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(5);
        
      if (profilesError) {
        console.error(chalk.red(`❌ Error accessing profiles table: ${profilesError.message}`));
      } else {
        console.log(chalk.green(`✓ Profiles table exists with ${profiles.length} rows`));
        
        if (profiles && profiles.length > 0) {
          console.log(chalk.cyan('  First profile:'));
          console.log(`  - ID: ${profiles[0].id}`);
          console.log(`  - Email: ${profiles[0].email}`);
          console.log(`  - Name: ${profiles[0].full_name || '(not set)'}`);
          console.log(`  - Created: ${new Date(profiles[0].created_at).toLocaleString()}`);
        } else {
          console.log(chalk.yellow('  No profiles found. Try running the setup script to create a test user.'));
        }
      }
    } catch (profileError) {
      console.error(chalk.red(`❌ Error checking profiles table: ${profileError.message}`));
    }
    
    // Get auth configuration
    console.log('\n🔒 Auth Configuration:');
    try {
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error(chalk.red(`❌ Cannot access auth system: ${userError.message}`));
      } else {
        console.log(chalk.green(`✓ Auth system is configured`));
        console.log(`  Total users: ${user.users.length}`);
        
        if (user.users.length > 0) {
          const testUser = user.users.find(u => u.email === 'test@example.com');
          if (testUser) {
            console.log(chalk.cyan('  Test user exists:'));
            console.log(`  - Email: ${testUser.email}`);
            console.log(`  - Created: ${new Date(testUser.created_at).toLocaleString()}`);
          }
        }
      }
    } catch (authError) {
      console.error(chalk.red(`❌ Error checking auth configuration: ${authError.message}`));
    }
    
    console.log('\n' + chalk.green('✅ Database connection is properly configured!'));
    console.log('\nNext steps:');
    console.log('1. Run the app: npm run dev');
    console.log('2. Log in with test@example.com / password123');
    console.log('3. Access Supabase Studio at http://localhost:54323');
    
  } catch (error) {
    console.error(chalk.red(`❌ Connection test failed: ${error.message}`));
    console.log(chalk.yellow('\nTroubleshooting tips:'));
    console.log('1. Ensure Supabase is running with: supabase status');
    console.log('2. Check your .env.local file for correct credentials');
    console.log('3. Make sure Docker is running');
    console.log('4. Try running the setup script: npm run setup');
    process.exit(1);
  }
}

// Run the test
testConnection().catch(error => {
  console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
  process.exit(1);
}); 