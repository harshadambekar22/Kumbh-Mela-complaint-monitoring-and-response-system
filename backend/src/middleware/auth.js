const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing auth token" });
  }
  const token = auth.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

module.exports = {
  authenticate,
  requireRoles,
};
