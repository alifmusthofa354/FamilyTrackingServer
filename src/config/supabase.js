require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables.');
    // Don't throw error to allow server to start, but Supabase functionality will fail
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
