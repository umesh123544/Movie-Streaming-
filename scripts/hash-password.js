// Usage: node scripts/hash-password.js "your-chosen-password"
// Copy the printed hash into .env.local as ADMIN_PASSWORD_HASH

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log('\nAdd this to your .env.local:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
