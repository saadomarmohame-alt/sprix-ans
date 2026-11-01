const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function sendError(res, err) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({
    error: status >= 500 ? "حصل خطأ في السيرفر. راجع إعدادات Supabase في Vercel." : err.message
  });
}

module.exports = { getSupabase, sendError };
