const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function createBackup() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const backupDir = path.resolve(process.env.BACKUP_DIR || './backups');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = path.join(backupDir, `sotera-${stamp}.sql`);
  const file = fs.createWriteStream(output, { mode: 0o600 });

  await new Promise((resolve, reject) => {
    const pgDump = spawn('pg_dump', ['--dbname', process.env.DATABASE_URL, '--format', 'plain'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    pgDump.stdout.pipe(file);
    let errorOutput = '';
    pgDump.stderr.on('data', chunk => { errorOutput += chunk.toString(); });
    pgDump.on('error', reject);
    pgDump.on('close', code => {
      file.end();
      if (code === 0) resolve();
      else reject(new Error(errorOutput || `pg_dump exited with code ${code}`));
    });
  });

  let finalOutput = output;
  if (process.env.BACKUP_PASSPHRASE) {
    const encryptedOutput = `${output}.enc`;
    await new Promise((resolve, reject) => {
      const openssl = spawn('openssl', [
        'enc', '-aes-256-cbc', '-salt', '-pbkdf2',
        '-pass', 'env:BACKUP_PASSPHRASE',
        '-in', output,
        '-out', encryptedOutput
      ], {
        env: { ...process.env, BACKUP_PASSPHRASE: process.env.BACKUP_PASSPHRASE },
        stdio: ['ignore', 'ignore', 'pipe']
      });
      let errorOutput = '';
      openssl.stderr.on('data', chunk => { errorOutput += chunk.toString(); });
      openssl.on('error', reject);
      openssl.on('close', code => {
        if (code === 0) {
          fs.unlinkSync(output);
          resolve();
        } else {
          reject(new Error(errorOutput || `openssl exited with code ${code}`));
        }
      });
    });
    finalOutput = encryptedOutput;
  }

  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 35);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const file of fs.readdirSync(backupDir)) {
    const filePath = path.join(backupDir, file);
    if (fs.statSync(filePath).isFile() && fs.statSync(filePath).mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
    }
  }

  console.log(`Backup created: ${finalOutput}`);
  return finalOutput;
}

if (require.main === module) {
  createBackup().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = createBackup;
