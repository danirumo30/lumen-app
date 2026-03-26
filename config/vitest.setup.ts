import 'dotenv/config';

// Ensure we're using the test environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase environment variables not found. Tests may fail.');
}
