const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'MedicineStoreSecretKey2024SuperSecureKeyAtLeast32Chars!';
const JWT_ISSUER = 'MedicineStoreAPI';
const JWT_AUDIENCE = 'MedicineStoreApp';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.Id,
      username: user.Username,
      fullName: user.FullName,
      role: user.Role
    },
    JWT_SECRET,
    { expiresIn: '24h', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { generateToken, authMiddleware };
