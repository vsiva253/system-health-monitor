export function authAgent(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  const allow = (process.env.AGENT_API_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allow.includes(token)) {
    return res.status(401).json({ error: "Invalid token" });
  }
  next();
}
