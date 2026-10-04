'use strict';
/**
 * Discord Panel - sunucu tarafı
 * Express (giriş + statik dosyalar) + Socket.IO (canlı veri) + discord.js (bot)
 */
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { PassThrough, Readable } = require('stream');
const express = require('express');
const { Server } = require('socket.io');
const {
  Client, GatewayIntentBits, Options, ChannelType, PermissionsBitField, Events, Partials,
} = require('discord.js');
const voice = require('@discordjs/voice');
const prism = require('prism-media');

// ---------------------------------------------------------------- Ayarlar
const { DISCORD_TOKEN, SITE_PASSWORD } = process.env;
const PORT = process.env.PORT || 3000;
const DISPLAY_PREFIX = process.env.DISPLAY_PREFIX || ''; // örn: "Ahmet"  -> mesajlar "**Ahmet:** merhaba" olur
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || '';
const CLEAN_EVERY_MS = (Number(process.env.CLEAN_EVERY_MIN) || 10) * 60 * 1000;
const PING_EVERY_MS = 5 * 60 * 1000;
const SESSION_DAYS = 7;

if (!DISCORD_TOKEN || !SITE_PASSWORD) {
  console.error('HATA: DISCORD_TOKEN ve SITE_PASSWORD ortam değişkenleri zorunlu.');
  process.exit(1);
}
const SECRET = process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`${DISCORD_TOKEN}|${SITE_PASSWORD}`).digest('hex');

// ---------------------------------------------------------------- Oturum (cookie) yardımcıları
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const safeEq = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
function makeSession() {
  const exp = String(Date.now() + SESSION_DAYS * 864e5);
  return `${exp}.${sign(exp)}`;
}
function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function validSession(header) {
  const tok = parseCookies(header).sid;
  if (!tok) return false;
  const [exp, sig] = tok.split('.');
  if (!exp || !sig || !safeEq(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

// Basit giriş denemesi sınırı (IP başına 10 dakikada 6 deneme)
const attempts = new Map();
function tooMany(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.reset < now) return false;
  return a.count >= 6;
}
function fail(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.reset < now) attempts.set(ip, { count: 1, reset: now + 10 * 60e3 });
  else a.count++;
}

// ---------------------------------------------------------------- Discord istemcisi (az RAM)
const keepMe = { keepOverLimit: (x) => x.id === x.client.user?.id };
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,        // Developer Portal'da açılmalı
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,      // Developer Portal'da açılmalı
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel], // DM mesajlarını almak için
  makeCache: Options.cacheWithLimits({
    MessageManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    PresenceManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    GuildEmojiManager: 0,
    GuildStickerManager: 0,
    GuildInviteManager: 0,
    GuildBanManager: 0,
    GuildScheduledEventManager: 0,
    StageInstanceManager: 0,
    AutoModerationRuleManager: 0,
    GuildMemberManager: { maxSize: 150, ...keepMe },
    UserManager: { maxSize: 150, ...keepMe },
  }),
});

let botReady = false;
client.once(Events.ClientReady, (c) => {
  botReady = true;
  console.log(`Bot hazır: ${c.user.tag} | ${c.guilds.cache.size} sunucu`);
});
client.on('error', (e) => console.error('discord.js hata:', e.message));

// ---------------------------------------------------------------- Express + Socket.IO
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/health', (_req, res) => res.type('text').send('ok'));

app.get('/', (req, res) => {
  const file = validSession(req.headers.cookie) ? 'index.html' : 'login.html';
  res.sendFile(path.join(__dirname, 'views', file));
});

app.post('/login', express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
  if (tooMany(req.ip)) return res.status(429).redirect('/?e=beklet');
  if (!safeEq(req.body.password || '', SITE_PASSWORD)) {
    fail(req.ip);
    return res.redirect('/?e=1');
  }
  const secure = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `sid=${encodeURIComponent(makeSession())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`);
  res.redirect('/');
});

app.post('/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.redirect('/');
});

app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: '1h' }));

const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1.5e6, pingInterval: 20000, pingTimeout: 25000 });
io.use((socket, next) => {
  if (validSession(socket.handshake.headers.cookie)) return next();
  next(new Error('unauthorized'));
});

// ---------------------------------------------------------------- Yardımcılar
const getGuild = (id) => {
  const g = client.guilds.cache.get(id);
  if (!g) throw new Error('Sunucu bulunamadı');
  return g;
};
const toHex = (n) => `#${(n || 0).toString(16).padStart(6, '0')}`;
const avatarOf = (u) => u.displayAvatarURL({ size: 64, extension: 'png' });

function serMsg(m) {
  if (!m || !m.author) return null;
  return {
    id: m.id,
    channelId: m.channelId,
    content: m.content || '',
    ts: m.createdTimestamp,
    edited: !!m.editedTimestamp,
    author: {
      id: m.author.id,
      name: m.member?.displayName || m.author.globalName || m.author.username,
      avatar: avatarOf(m.author),
      bot: m.author.bot,
      color: m.member?.displayHexColor && m.member.displayHexColor !== '#000000' ? m.member.displayHexColor : null,
    },
    attachments: [...(m.attachments?.values() || [])].map((a) => ({ url: a.url, name: a.name, type: a.contentType })),
  };
}

function serChannels(guild) {
  const list = [];
  guild.channels.cache.forEach((c) => {
    if (c.isThread()) return;
    const isText = c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement;
    const isVoice = c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice;
    const isCat = c.type === ChannelType.GuildCategory;
    if (!isText && !isVoice && !isCat) return;
    const item = {
      id: c.id, name: c.name, parentId: c.parentId, position: c.rawPosition,
      kind: isCat ? 'category' : isVoice ? 'voice' : 'text',
    };
    if (isVoice) {
      item.members = guild.voiceStates.cache
        .filter((v) => v.channelId === c.id)
        .map((v) => ({ id: v.id, name: v.member?.displayName || v.id }));
    }
    list.push(item);
  });
  return list;
}

const COMMON_PERMS = [
  'Administrator', 'ManageChannels', 'ManageRoles', 'ManageMessages',
  'KickMembers', 'BanMembers', 'ViewChannel', 'SendMessages', 'Connect', 'Speak',
];
const serRole = (r) => ({
  id: r.id, name: r.name, color: toHex(r.color), position: r.position,
  managed: r.managed, hoist: r.hoist, everyone: r.id === r.guild.id,
  perms: COMMON_PERMS.filter((p) => r.permissions.has(PermissionsBitField.Flags[p], false)),
});
const mergePerms = (oldBits, selected) => {
  let bits = BigInt(oldBits);
  COMMON_PERMS.forEach((p) => { bits &= ~PermissionsBitField.Flags[p]; });
  (selected || []).forEach((p) => {
    if (COMMON_PERMS.includes(p)) bits |= PermissionsBitField.Flags[p];
  });
  return bits;
};
const parseColor = (c) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? parseInt(c.slice(1), 16) : 0);

const serUser = (u, member) => ({
  id: u.id,
  name: member?.displayName || u.globalName || u.username,
  username: u.username,
  avatar: avatarOf(u),
  bot: u.bot,
});

async function dmChannel(userId) {
  const u = await client.users.fetch(String(userId));
  if (u.bot) throw new Error('Botlara özel mesaj atılamaz');
  return u.createDM();
}
const dmErr = (e) => (e.code === 50007
  ? new Error('Bu kişiye mesaj gönderilemiyor (özel mesajları kapalı olabilir ya da botla ortak sunucunuz yok)')
  : e);
const okImg = (s) => typeof s === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,/.test(s) && s.length < 1_000_000;

async function buildProfile(userId, guildId) {
  const u = await client.users.fetch(String(userId), { force: true });
  const out = {
    id: u.id, username: u.username, name: u.globalName || u.username, bot: u.bot,
    avatar: u.displayAvatarURL({ size: 256, extension: 'png' }),
    banner: u.bannerURL({ size: 600, extension: 'png' }) || null,
    accent: u.hexAccentColor || null,
    created: u.createdTimestamp,
    about: null, member: null,
  };
  if (u.id === client.user.id) {
    try { if (!client.application.description) await client.application.fetch(); } catch { /* yut */ }
    out.about = client.application?.description || '';
  }
  if (guildId) {
    try {
      const g = getGuild(guildId);
      const m = await g.members.fetch(u.id);
      out.member = {
        guildName: g.name, nick: m.nickname, joined: m.joinedTimestamp,
        color: m.displayHexColor !== '#000000' ? m.displayHexColor : null,
        roles: m.roles.cache.filter((r) => r.id !== g.id).sort((a, b) => b.position - a.position)
          .map((r) => ({ id: r.id, name: r.name, color: toHex(r.color) })),
      };
    } catch { /* üye bu sunucuda değil */ }
  }
  return out;
}

// ---------------------------------------------------------------- Canlı Discord olayları -> tarayıcı
client.on(Events.MessageCreate, (m) => {
  const s = serMsg(m);
  if (!s) return;
  if (m.guildId) {
    io.to('authed').emit('message:new', { guildId: m.guildId, message: s });
  } else if (m.author.id !== client.user.id) {
    io.to('authed').emit('dm:message', { user: serUser(m.author), message: s });
  }
});
client.on(Events.MessageUpdate, (_o, n) => {
  const s = serMsg(n);
  if (s && s.content !== undefined && n.guildId) io.to('authed').emit('message:update', { guildId: n.guildId, message: s });
});
client.on(Events.MessageDelete, (m) => {
  if (m.guildId) io.to('authed').emit('message:delete', { channelId: m.channelId, id: m.id });
});
const chChanged = (guildId) => io.to('authed').emit('channels:changed', { guildId });
client.on(Events.ChannelCreate, (c) => chChanged(c.guildId));
client.on(Events.ChannelDelete, (c) => chChanged(c.guildId));
client.on(Events.ChannelUpdate, (_o, c) => chChanged(c.guildId));
client.on(Events.VoiceStateUpdate, (_o, n) => chChanged(n.guild.id));
['RoleCreate', 'RoleDelete', 'RoleUpdate'].forEach((ev) =>
  client.on(Events[ev], (r) => io.to('authed').emit('roles:changed', { guildId: r.guild.id })));
client.on(Events.GuildMemberUpdate, (_o, n) => io.to('authed').emit('member:changed', { guildId: n.guild.id, userId: n.id }));

// ---------------------------------------------------------------- Sesli sohbet köprüsü
const FRAME_SAMPLES = 960;                    // 20 ms @ 48kHz
const FRAME_BYTES = FRAME_SAMPLES * 2 * 2;    // stereo s16le
const SILENCE = Buffer.alloc(FRAME_BYTES);

class MicSource extends Readable {
  constructor() { super({ highWaterMark: FRAME_BYTES }); this.q = []; }
  add(buf) {
    this.q.push(buf);
    while (this.q.length > 8) this.q.shift(); // gecikmeyi sınırla
  }
  _read() { this.push(this.q.length ? this.q.shift() : SILENCE); }
}

const vc = { connection: null, guildId: null, channelId: null, name: null, temp: false, player: null, source: null, subs: new Map() };

async function voiceLeave() {
  vc.subs.forEach((s) => { try { s.destroy(); } catch { /* yut */ } });
  vc.subs.clear();
  try { vc.player?.stop(true); } catch { /* yut */ }
  try { vc.source?.destroy(); } catch { /* yut */ }
  try { vc.connection?.destroy(); } catch { /* yut */ }
  const delTemp = vc.temp ? client.guilds.cache.get(vc.guildId)?.channels.cache.get(vc.channelId) : null;
  Object.assign(vc, { connection: null, guildId: null, channelId: null, name: null, temp: false, player: null, source: null });
  if (delTemp) delTemp.delete('Özel ses odası kapandı').catch(() => {});
  io.to('authed').emit('voice:state', null);
}

async function voiceJoin({ guildId, channelId }, temp = false) {
  await voiceLeave();
  const guild = getGuild(guildId);
  const ch = guild.channels.cache.get(channelId);
  if (!ch || !ch.isVoiceBased()) throw new Error('Ses kanalı bulunamadı');

  const connection = voice.joinVoiceChannel({
    channelId, guildId, adapterCreator: guild.voiceAdapterCreator, selfDeaf: false, selfMute: false,
  });
  try {
    await voice.entersState(connection, voice.VoiceConnectionStatus.Ready, 20e3);
  } catch (e) {
    try { connection.destroy(); } catch { /* yut */ }
    throw new Error('Ses kanalına bağlanılamadı (yetki ya da ağ sorunu olabilir)');
  }

  const player = voice.createAudioPlayer({ behaviors: { noSubscriber: voice.NoSubscriberBehavior.Play } });
  const source = new MicSource();
  const resource = voice.createAudioResource(source, { inputType: voice.StreamType.Raw });
  connection.subscribe(player);
  player.play(resource);
  player.on('error', (e) => console.error('player hata:', e.message));

  Object.assign(vc, { connection, guildId, channelId, name: ch.name, temp, player, source });

  // Discord'dan gelen sesleri tarayıcıya aktar
  connection.receiver.speaking.on('start', async (userId) => {
    if (userId === client.user.id || vc.subs.has(userId)) return;
    const opusStream = connection.receiver.subscribe(userId, {
      end: { behavior: voice.EndBehaviorType.AfterSilence, duration: 300 },
    });
    const decoder = new prism.opus.Decoder({ rate: 48000, channels: 1, frameSize: FRAME_SAMPLES });
    vc.subs.set(userId, opusStream);

    let name = userId;
    try { name = (guild.members.cache.get(userId) || await guild.members.fetch(userId)).displayName; } catch { /* yut */ }
    io.to('authed').emit('voice:speaking', { userId, name, on: true });

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      vc.subs.delete(userId);
      try { opusStream.destroy(); } catch { /* yut */ }
      try { decoder.destroy(); } catch { /* yut */ }
      io.to('authed').emit('voice:speaking', { userId, name, on: false });
    };
    opusStream.once('end', finish);
    opusStream.once('close', finish);
    opusStream.on('error', finish);
    decoder.on('error', finish);
    decoder.on('data', (buf) => io.to('authed').volatile.emit('voice:audio', { userId, buf }));
    opusStream.pipe(decoder);
  });

  connection.on(voice.VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        voice.entersState(connection, voice.VoiceConnectionStatus.Signalling, 5e3),
        voice.entersState(connection, voice.VoiceConnectionStatus.Connecting, 5e3),
      ]);
    } catch {
      if (vc.connection === connection) voiceLeave();
    }
  });

  io.to('authed').emit('voice:state', { guildId, channelId, name: ch.name });
  return { guildId, channelId };
}

// ---------------------------------------------------------------- Socket olayları
io.on('connection', (socket) => {
  socket.join('authed');

  const on = (ev, fn) => socket.on(ev, async (data, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    try { reply({ ok: true, data: await fn(data || {}) }); }
    catch (e) { reply({ ok: false, error: e.message || 'Bilinmeyen hata' }); }
  });

  on('app:init', async () => ({
    ready: botReady,
    bot: botReady ? { id: client.user.id, name: client.user.username, avatar: avatarOf(client.user) } : null,
    guilds: client.guilds.cache.map((g) => ({
      id: g.id, name: g.name, icon: g.iconURL({ size: 64, extension: 'png' }),
    })),
    voice: vc.channelId ? { guildId: vc.guildId, channelId: vc.channelId, name: vc.name } : null,
    prefix: DISPLAY_PREFIX,
  }));

  // ----- Kanallar
  on('channels:list', ({ guildId }) => serChannels(getGuild(guildId)));

  on('channel:create', async ({ guildId, name, kind, parentId }) => {
    const guild = getGuild(guildId);
    const clean = String(name || '').trim().slice(0, 100);
    if (!clean) throw new Error('Kanal adı boş olamaz');
    const type = kind === 'voice' ? ChannelType.GuildVoice : kind === 'category' ? ChannelType.GuildCategory : ChannelType.GuildText;
    const opts = { name: clean, type };
    if (kind !== 'category' && parentId) opts.parent = parentId;
    const ch = await guild.channels.create(opts);
    return { id: ch.id };
  });

  on('channel:rename', async ({ guildId, channelId, name }) => {
    const ch = getGuild(guildId).channels.cache.get(channelId);
    if (!ch) throw new Error('Kanal bulunamadı');
    await ch.setName(String(name || '').trim().slice(0, 100));
  });

  on('channel:delete', async ({ guildId, channelId }) => {
    const ch = getGuild(guildId).channels.cache.get(channelId);
    if (!ch) throw new Error('Kanal bulunamadı');
    if (vc.channelId === channelId) await voiceLeave();
    await ch.delete();
  });

  // ----- Mesajlar
  on('messages:fetch', async ({ guildId, channelId, before }) => {
    const ch = getGuild(guildId).channels.cache.get(channelId);
    if (!ch || !ch.isTextBased()) throw new Error('Metin kanalı bulunamadı');
    const col = await ch.messages.fetch({ limit: 30, ...(before ? { before } : {}) });
    return [...col.values()].reverse().map(serMsg).filter(Boolean);
  });

  on('message:send', async ({ guildId, channelId, content }) => {
    const ch = getGuild(guildId).channels.cache.get(channelId);
    if (!ch || !ch.isTextBased()) throw new Error('Metin kanalı bulunamadı');
    let text = String(content || '').trim();
    if (!text) throw new Error('Mesaj boş');
    if (DISPLAY_PREFIX && !text.startsWith('ENC1:')) text = `**${DISPLAY_PREFIX}:** ${text}`;
    if (text.length > 2000) throw new Error('Mesaj 2000 karakteri aşıyor');
    await ch.send({ content: text, allowedMentions: { parse: [] } });
  });

  on('message:delete', async ({ guildId, channelId, messageId }) => {
    const ch = getGuild(guildId).channels.cache.get(channelId);
    if (!ch || !ch.isTextBased()) throw new Error('Kanal bulunamadı');
    await ch.messages.delete(messageId);
  });

  // ----- Roller
  on('roles:list', ({ guildId }) =>
    getGuild(guildId).roles.cache.sort((a, b) => b.position - a.position).map(serRole));

  on('role:create', async ({ guildId, name, color, perms, hoist }) => {
    const guild = getGuild(guildId);
    const r = await guild.roles.create({
      name: String(name || 'Yeni rol').slice(0, 100),
      color: parseColor(color),
      hoist: !!hoist,
      permissions: mergePerms(0n, perms),
    });
    return serRole(r);
  });

  on('role:edit', async ({ guildId, roleId, name, color, perms, hoist }) => {
    const r = getGuild(guildId).roles.cache.get(roleId);
    if (!r) throw new Error('Rol bulunamadı');
    const data = { permissions: mergePerms(r.permissions.bitfield, perms) };
    if (r.id !== r.guild.id) {
      data.name = String(name || r.name).slice(0, 100);
      data.color = parseColor(color);
      data.hoist = !!hoist;
    }
    return serRole(await r.edit(data));
  });

  on('role:delete', async ({ guildId, roleId }) => {
    const r = getGuild(guildId).roles.cache.get(roleId);
    if (!r) throw new Error('Rol bulunamadı');
    await r.delete();
  });

  // ----- Üyeler
  on('members:list', async ({ guildId, query }) => {
    const guild = getGuild(guildId);
    const q = String(query || '').trim();
    const col = q ? await guild.members.search({ query: q, limit: 50 }) : await guild.members.fetch({ limit: 100 });
    return col.map((m) => ({
      id: m.id, name: m.displayName, avatar: avatarOf(m.user), bot: m.user.bot,
      color: m.displayHexColor !== '#000000' ? m.displayHexColor : null,
      roles: [...m.roles.cache.keys()].filter((id) => id !== guild.id),
    }));
  });

  on('member:role', async ({ guildId, userId, roleId, add }) => {
    const guild = getGuild(guildId);
    const m = await guild.members.fetch(userId);
    if (add) await m.roles.add(roleId); else await m.roles.remove(roleId);
    return [...m.roles.cache.keys()].filter((id) => id !== guild.id);
  });

  // ----- Özel mesajlar (DM)
  on('dm:fetch', async ({ userId, before }) => {
    const dm = await dmChannel(userId);
    const col = await dm.messages.fetch({ limit: 30, ...(before ? { before } : {}) });
    return [...col.values()].reverse().map(serMsg).filter(Boolean);
  });
  on('dm:send', async ({ userId, content }) => {
    const dm = await dmChannel(userId);
    let text = String(content || '').trim();
    if (!text) throw new Error('Mesaj boş');
    if (DISPLAY_PREFIX && !text.startsWith('ENC1:')) text = `**${DISPLAY_PREFIX}:** ${text}`;
    if (text.length > 2000) throw new Error('Mesaj 2000 karakteri aşıyor');
    try { return serMsg(await dm.send({ content: text, allowedMentions: { parse: [] } })); } catch (e) { throw dmErr(e); }
  });
  on('dm:delete', async ({ userId, messageId }) => {
    const dm = await dmChannel(userId);
    const m = await dm.messages.fetch(messageId);
    if (m.author.id !== client.user.id) throw new Error('DM\'de sadece botun kendi mesajları silinebilir');
    await m.delete();
  });

  // ----- Kullanıcılar / profil
  on('users:search', async ({ query }) => {
    const q = String(query || '').trim();
    if (!q) return [];
    if (/^\d{15,22}$/.test(q)) return [serUser(await client.users.fetch(q))];
    const seen = new Map();
    for (const g of client.guilds.cache.values()) {
      const col = await g.members.search({ query: q, limit: 10 });
      col.forEach((m) => {
        if (!m.user.bot && m.id !== client.user.id && !seen.has(m.id)) seen.set(m.id, serUser(m.user, m));
      });
      if (seen.size >= 20) break;
    }
    return [...seen.values()];
  });
  on('users:resolve', async ({ ids }) => {
    const out = [];
    for (const id of (Array.isArray(ids) ? ids : []).slice(0, 50)) {
      try { out.push(serUser(await client.users.fetch(String(id)))); } catch { /* yut */ }
    }
    return out;
  });
  on('profile:get', ({ userId, guildId }) => buildProfile(userId, guildId));

  on('me:update', async ({ username, about, avatar, banner }) => {
    const errors = [];
    const u = String(username || '').trim();
    if (u && u !== client.user.username) {
      try { await client.user.setUsername(u); } catch (e) { errors.push(`Kullanıcı adı: ${e.message}`); }
    }
    if (avatar) {
      if (!okImg(avatar)) errors.push('Avatar geçersiz');
      else { try { await client.user.setAvatar(avatar); } catch (e) { errors.push(`Avatar: ${e.message}`); } }
    }
    if (banner) {
      if (!okImg(banner)) errors.push('Afiş geçersiz');
      else { try { await client.user.setBanner(banner); } catch (e) { errors.push(`Afiş: ${e.message}`); } }
    }
    if (typeof about === 'string') {
      try {
        await client.application.fetch();
        if (about !== client.application.description) await client.application.edit({ description: about.slice(0, 400) });
      } catch (e) { errors.push(`Hakkımda: ${e.message}`); }
    }
    return { errors, profile: await buildProfile(client.user.id, null) };
  });

  on('me:nick', async ({ guildId, nick }) => {
    await getGuild(guildId).members.me.setNickname(String(nick || '').trim().slice(0, 32) || null);
  });

  // ----- Ses
  on('voice:private', async ({ guildId, userId }) => {
    // Botlar DM araması yapamaz; bunun yerine sadece iki tarafın görebildiği geçici bir ses kanalı açılır.
    const guilds = [...client.guilds.cache.values()].sort((a, b) => (b.id === guildId) - (a.id === guildId));
    let guild = null; let member = null;
    for (const g of guilds) {
      try { member = await g.members.fetch(String(userId)); guild = g; break; } catch { /* sonraki */ }
    }
    if (!guild) throw new Error('Bu kişi botun bulunduğu hiçbir sunucuda değil');
    const F = PermissionsBitField.Flags;
    const ch = await guild.channels.create({
      name: `özel-${member.displayName}`.slice(0, 90),
      type: ChannelType.GuildVoice,
      permissionOverwrites: [
        { id: guild.id, deny: [F.ViewChannel, F.Connect] },
        { id: member.id, allow: [F.ViewChannel, F.Connect, F.Speak] },
        { id: client.user.id, allow: [F.ViewChannel, F.Connect, F.Speak, F.ManageChannels] },
      ],
    });
    try {
      await voiceJoin({ guildId: guild.id, channelId: ch.id }, true);
    } catch (e) { ch.delete().catch(() => {}); throw e; }
    let dmSent = false;
    try {
      const dm = await dmChannel(member.id);
      await dm.send(`${DISPLAY_PREFIX ? `**${DISPLAY_PREFIX}** s` : 'S'}eni özel ses odasına çağırıyor: https://discord.com/channels/${guild.id}/${ch.id}`);
      dmSent = true;
    } catch { /* DM kapalı olabilir */ }
    return { guildId: guild.id, channelId: ch.id, guildName: guild.name, dmSent };
  });
  on('voice:join', voiceJoin);
  on('voice:leave', voiceLeave);

  socket.on('voice:mic', (buf) => {
    if (!vc.source || !Buffer.isBuffer(buf) || buf.length !== FRAME_SAMPLES * 2) return;
    const stereo = Buffer.allocUnsafe(FRAME_BYTES);
    for (let i = 0; i < FRAME_SAMPLES; i++) {
      const s = buf.readInt16LE(i * 2);
      stereo.writeInt16LE(s, i * 4);
      stereo.writeInt16LE(s, i * 4 + 2);
    }
    vc.source.add(stereo);
  });
});

// ---------------------------------------------------------------- RAM temizliği + uyumama
function cleanMemory() {
  try {
    client.guilds.cache.forEach((g) => {
      g.members.cache.sweep((m) => m.id !== client.user.id && !g.voiceStates.cache.has(m.id));
    });
    client.users.cache.sweep((u) => u.id !== client.user.id);
    if (typeof global.gc === 'function') global.gc();
  } catch (e) { console.error('temizlik hatası:', e.message); }
  const mb = Math.round(process.memoryUsage().rss / 1048576);
  io.to('authed').emit('cleanup', { rssMb: mb });
  console.log(`RAM temizlendi. RSS: ${mb} MB`);
}
setInterval(cleanMemory, CLEAN_EVERY_MS).unref();
setInterval(() => io.to('authed').emit('stats', { rssMb: Math.round(process.memoryUsage().rss / 1048576) }), 30e3).unref();

if (SELF_URL) {
  setInterval(() => {
    fetch(`${SELF_URL}/health`).then(() => console.log('keep-alive ok')).catch((e) => console.log('keep-alive hata:', e.message));
  }, PING_EVERY_MS).unref();
  console.log(`Keep-alive açık: ${SELF_URL}/health (5 dk'da bir)`);
} else {
  console.log('Keep-alive kapalı (RENDER_EXTERNAL_URL / PUBLIC_URL yok).');
}

process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e?.message || e));
process.on('uncaughtException', (e) => console.error('uncaughtException:', e?.message || e));

// ---------------------------------------------------------------- Başlat
server.listen(PORT, () => console.log(`Panel http://localhost:${PORT} adresinde`));
client.login(DISCORD_TOKEN).catch((e) => console.error('Bot girişi başarısız:', e.message));
