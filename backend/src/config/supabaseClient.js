const { createClient } = require('@supabase/supabase-js'); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERRO CRÍTICO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estão configurados no arquivo .env do backend.');
  throw new Error('Supabase URL and Service Role Key are required for backend operations.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = { supabase };
