const JWT_SECRET = process.env.JWT_SECRET || 'juanleme_jwt_secret_key_2026';
const JWT_ACCESS_EXPIRES = '15m';
const JWT_REFRESH_EXPIRES = '7d';
const BCRYPT_SALT_ROUNDS = 10;

module.exports = {
  JWT_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
  BCRYPT_SALT_ROUNDS,
};
