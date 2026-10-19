const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'moderation.json');

const DEFAULT_DATA = {
  warnings: {},
  settings: {},
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      warnings: parsed.warnings || {},
      settings: parsed.settings || {},
    };
  } catch (err) {
    console.error('[Database] Failed to read moderation.json, resetting to defaults:', err);
    return { warnings: {}, settings: {} };
  }
}

function writeDb(data) {
  ensureDb();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DB_FILE);
}

function addWarning(guildId, userId, moderatorId, moderatorTag, reason) {
  const db = readDb();
  if (!db.warnings[guildId]) {
    db.warnings[guildId] = {};
  }
  if (!db.warnings[guildId][userId]) {
    db.warnings[guildId][userId] = [];
  }

  const warnId = crypto.randomBytes(3).toString('hex').toUpperCase();
  const entry = {
    id: warnId,
    moderatorId,
    moderatorTag,
    reason,
    timestamp: Date.now(),
  };

  db.warnings[guildId][userId].push(entry);
  writeDb(db);

  return {
    ...entry,
    totalWarnings: db.warnings[guildId][userId].length,
  };
}

function getWarnings(guildId, userId) {
  const db = readDb();
  return db.warnings[guildId]?.[userId] || [];
}

function removeWarning(guildId, userId, warnId) {
  const db = readDb();
  const userWarns = db.warnings[guildId]?.[userId];
  if (!userWarns || userWarns.length === 0) {
    return null;
  }

  const normalizedId = warnId.trim().toUpperCase();
  const index = userWarns.findIndex((w) => w.id.toUpperCase() === normalizedId);
  if (index === -1) {
    return null;
  }

  const [removed] = userWarns.splice(index, 1);
  writeDb(db);
  return removed;
}

function clearWarnings(guildId, userId) {
  const db = readDb();
  const userWarns = db.warnings[guildId]?.[userId];
  if (!userWarns || userWarns.length === 0) {
    return 0;
  }

  const count = userWarns.length;
  db.warnings[guildId][userId] = [];
  writeDb(db);
  return count;
}

function setModLogChannel(guildId, channelId) {
  const db = readDb();
  if (!db.settings[guildId]) {
    db.settings[guildId] = {};
  }
  db.settings[guildId].modLogChannelId = channelId;
  writeDb(db);
}

function getModLogChannel(guildId) {
  const db = readDb();
  return db.settings[guildId]?.modLogChannelId || null;
}

module.exports = {
  addWarning,
  getWarnings,
  removeWarning,
  clearWarnings,
  setModLogChannel,
  getModLogChannel,
};
