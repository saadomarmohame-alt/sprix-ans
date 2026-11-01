const crypto = require("crypto");
const { getSupabase, sendError } = require("./_supabase");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const code = String((req.body && req.body.code) || "").trim().toUpperCase();
    const deviceToken = String((req.body && req.body.deviceToken) || "");
    if (!/^[A-Z0-9-]{6,64}$/.test(code)) {
      return res.status(400).json({ error: "اكتب كود اشتراك صحيح." });
    }
    if (!/^[a-f0-9]{64}$/.test(deviceToken)) {
      return res.status(400).json({ error: "معرّف الجهاز غير صالح. حدّث الصفحة وحاول تاني." });
    }
    const deviceHash = crypto.createHash("sha256").update(deviceToken).digest("hex");
    const { data, error } = await getSupabase().rpc("redeem_membership_code", {
      p_code: code,
      p_device_hash: deviceHash
    });
    if (error) {
      const message = String(error.message || "");
      if (message.includes("CODE_NOT_FOUND")) return res.status(400).json({ error: "الكود غير صحيح." });
      if (message.includes("CODE_ALREADY_USED")) return res.status(400).json({ error: "الكود مستخدم بالفعل." });
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return res.status(200).json({
      success: true,
      days: row.days,
      expiresAt: row.expires_at
    });
  } catch (err) { return sendError(res, err); }
};
