const crypto = require("crypto");
const { getSupabase, sendError } = require("./_supabase");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const supplied = String(req.headers["x-admin-secret"] || "");
  const expected = String(process.env.ADMIN_SECRET || "");
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "غير مصرح." });
  }
  try {
    const days = Number((req.body && req.body.days) || 30);
    const requestedCode = String((req.body && req.body.code) || "").trim().toUpperCase();
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return res.status(400).json({ error: "مدة الاشتراك لازم تكون من يوم إلى 3650 يوم." });
    }
    const code = requestedCode || crypto.randomBytes(6).toString("hex").toUpperCase();
    if (!/^[A-Z0-9-]{6,64}$/.test(code)) {
      return res.status(400).json({ error: "الكود لازم يتكون من حروف إنجليزية وأرقام وشرطة، بطول 6 إلى 64." });
    }
    const { error } = await getSupabase().from("membership_codes").insert({
      code, days, used: false
    });
    if (error && error.code === "23505") return res.status(409).json({ error: "الكود موجود بالفعل." });
    if (error) throw error;
    return res.status(201).json({ success: true, code, days });
  } catch (err) { return sendError(res, err); }
};
