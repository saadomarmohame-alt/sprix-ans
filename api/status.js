const crypto = require("crypto");
const { getSupabase, sendError } = require("./_supabase");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const deviceToken = String((req.body && req.body.deviceToken) || "");
    if (!/^[a-f0-9]{64}$/.test(deviceToken)) {
      return res.status(400).json({ error: "معرّف الجهاز غير صالح. حدّث الصفحة وحاول تاني." });
    }
    const deviceHash = crypto.createHash("sha256").update(deviceToken).digest("hex");
    const db = getSupabase();
    const { data, error } = await db.rpc("check_membership", { p_device_hash: deviceHash });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({
      active: !!(row && row.active),
      expiresAt: row && row.expires_at ? row.expires_at : null
    });
  } catch (err) { return sendError(res, err); }
};
