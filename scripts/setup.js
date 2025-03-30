#!/usr/bin/env node

/**
 * Supabase Setup Script
 * 
 * This script:
 * 1. Checks if Supabase is running
 * 2. Resets the database
 * 3. Creates a test user
 * 4. Sets up the user's profile
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Constants
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';
const TEST_USER_NAME = 'Test User';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if Supabase is running
 */
function checkSupabaseStatus() {
  try {
    console.log('📋 Checking Supabase status...');
    const result = execSync('supabase status', { encoding: 'utf-8' });
    
    if (result.includes('DB URL')) {
      console.log('✅ Supabase is running');
      return true;
    } else {
      console.log('⚠️  Supabase may not be running correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking Supabase status:', error.message);
    return false;
  }
}

/**
 * Start Supabase if it's not running
 */
function startSupabaseIfNeeded() {
  try {
    console.log('🚀 Starting Supabase...');
    execSync('supabase start', { encoding: 'utf-8', stdio: 'inherit' });
    console.log('✅ Supabase started successfully');
    return true;
  } catch (error) {
    console.error('❌ Error starting Supabase:', error.message);
    return false;
  }
}

/**
 * Reset the database
 */
function resetDatabase() {
  try {
    console.log('🔄 Resetting Supabase database...');
    execSync('supabase db reset', { encoding: 'utf-8', stdio: 'inherit' });
    console.log('✅ Database reset complete');
    
    // Wait a moment for the database to settle
    console.log('⏳ Waiting for database to initialize...');
    execSync('sleep 3');
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    return false;
  }
}

/**
 * Set the minimum password length to 8 characters
 */
async function configureAuth() {
  try {
    console.log('🔒 Setting up Auth configuration...');
    
    // This would typically use the Management API, but for local dev
    // we'll rely on the user setting this manually in the Supabase UI
    console.log('⚠️  Please manually set the minimum password length to 8 in the Supabase Studio');
    console.log('   Navigate to Authentication > Settings > Auth Providers > Set minimum password length to 8');
    
    return true;
  } catch (error) {
    console.error('❌ Error configuring auth:', error.message);
    return false;
  }
}

/**
 * Create a test user
 */
async function createTestUser() {
  try {
    console.log(`👤 Creating test user: ${TEST_USER_EMAIL}`);
    
    // First check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', TEST_USER_EMAIL);
    
    if (checkError) {
      throw new Error(`Error checking for existing user: ${checkError.message}`);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  Test user already exists, skipping creation');
      return true;
    }
    
    // Create user with auth API
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true, // Skip email verification
      user_metadata: {
        full_name: TEST_USER_NAME,
      },
    });
    
    if (createError) {
      throw new Error(`Error creating test user: ${createError.message}`);
    }
    
    console.log('✅ Test user created successfully');
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Password: ${TEST_USER_PASSWORD}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    
    // If the error is about the user already existing, we can continue
    if (error.message.includes('already exists')) {
      console.log('⚠️  User already exists, continuing with setup');
      return true;
    }
    
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Starting Supabase setup...');
  
  // Check if Supabase is running
  const isRunning = checkSupabaseStatus();
  if (!isRunning) {
    const started = startSupabaseIfNeeded();
    if (!started) {
      console.error('❌ Failed to start Supabase. Exiting.');
      process.exit(1);
    }
  }
  
  // Reset the database
  const resetSuccess = resetDatabase();
  if (!resetSuccess) {
    console.error('❌ Database reset failed. Exiting.');
    process.exit(1);
  }
  
  // Configure auth settings
  const authSuccess = await configureAuth();
  if (!authSuccess) {
    console.warn('⚠️  Auth configuration failed, but continuing with setup');
  }
  
  // Create a test user
  const userSuccess = await createTestUser();
  if (!userSuccess) {
    console.error('❌ Test user creation failed. Exiting.');
    process.exit(1);
  }
  
  console.log('');
  console.log('✅ Setup completed successfully!');
  console.log('');
  console.log('You can now run:');
  console.log('npm run dev');
  console.log('');
  console.log('And log in with:');
  console.log(`Email: ${TEST_USER_EMAIL}`);
  console.log(`Password: ${TEST_USER_PASSWORD}`);
  console.log('');
}

// Run the script
main().catch(err => {
  console.error('❌ Setup failed with error:', err);
  process.exit(1);
}); 