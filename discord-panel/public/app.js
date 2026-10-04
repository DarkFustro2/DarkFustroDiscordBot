'use strict';
/* Discord Panel - tarayıcı tarafı */

const socket = io({ transports: ['websocket', 'polling'] });
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------ İkonlar
const ICONS = {
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  micoff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/><path d="M3 3l18 18"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
  headphonesoff: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/><path d="M3 3l18 18"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  phoneoff: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/><path d="M3 3l18 18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  paperclip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
};
function ic(name, size = 18) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 24 24'); el.setAttribute('width', size); el.setAttribute('height', size);
  el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'currentColor'); el.setAttribute('stroke-width', '2');
  el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round'); el.setAttribute('aria-hidden', 'true');
  el.innerHTML = ICONS[name] || '';
  return el;
}
const setIcon = (el, name, size) => el.replaceChildren(ic(name, size));
document.querySelectorAll('[data-ic]').forEach((el) => setIcon(el, el.dataset.ic, Number(el.dataset.size) || 18));

// ------------------------------------------------------------ Discord resimleri sunucu üzerinden (Türkiye'de CDN engelli)
const PROXY_HOSTS = ['cdn.discordapp.com', 'media.discordapp.net', 'images-ext-1.discordapp.net', 'images-ext-2.discordapp.net'];
function px(u) {
  if (typeof u !== 'string') return u;
  try {
    const x = new URL(u);
    if (x.protocol === 'https:' && PROXY_HOSTS.includes(x.hostname)) return `/img?u=${encodeURIComponent(u)}`;
  } catch { /* yut */ }
  return u;
}
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#2a2f3c"/><circle cx="20" cy="16" r="7" fill="#8b92a5"/><path d="M6 40c0-9 6-14 14-14s14 5 14 14z" fill="#8b92a5"/></svg>');
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && !t.dataset.fb && !t.classList.contains('prev')) { t.dataset.fb = '1'; t.src = PLACEHOLDER; }
}, true);
const MAX_MSGS = 100;      // ekranda tutulan en fazla mesaj
const KEEP_AFTER_CLEAN = 30; // RAM temizliğinde ekranda kalacak mesaj sayısı

const S = {
  bot: null, prefix: '',
  guilds: [], guildId: null,
  channels: [], channelId: null,
  messages: [],
  voice: null,           // { guildId, channelId }
  roles: [], members: [],
  key: null, keyOn: false,
  muted: false, deaf: false,
  speaking: new Map(),
  hasMore: true,
  mode: 'guild',          // 'guild' = sunucu görünümü, 'home' = arkadaşlar / özel mesajlar
  dmId: null,             // açık özel mesaj kullanıcısı
  contacts: [],           // { id, name, avatar, friend }
  unread: {},
  resolved: false,
};
try { S.contacts = JSON.parse(localStorage.getItem('contacts') || '[]'); } catch { S.contacts = []; }
const chatOpen = () => (S.mode === 'home' ? S.dmId : S.channelId);
function saveContacts() { try { localStorage.setItem('contacts', JSON.stringify(S.contacts)); } catch { /* yut */ } }
function upsertContact(u, friend) {
  let c = S.contacts.find((x) => x.id === u.id);
  if (!c) { c = { id: u.id, name: u.name, avatar: u.avatar, friend: !!friend }; S.contacts.push(c); }
  else { c.name = u.name; c.avatar = u.avatar; if (friend !== undefined) c.friend = friend; }
  saveContacts();
  return c;
}

// ------------------------------------------------------------ Yardımcılar
const call = (ev, data) => new Promise((res, rej) =>
  socket.emit(ev, data || {}, (r) => (r && r.ok ? res(r.data) : rej(new Error((r && r.error) || 'Hata')))));

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, (k === 'src' || k === 'href') ? px(v) : v);
  }
  kids.flat().forEach((c) => { if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
}

let toastTimer;
function toast(msg, err) {
  const t = $('toast');
  t.textContent = msg;
  t.className = `show${err ? ' err' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 3500);
}
const guard = (fn) => async (...a) => { try { return await fn(...a); } catch (e) { toast(e.message, true); } };

function openModal(content) {
  const box = $('modalBox');
  box.replaceChildren(content);
  $('modal').hidden = false;
}
function closeModal() { $('modal').hidden = true; $('modalBox').replaceChildren(); }
$('modal').addEventListener('mousedown', (e) => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

const fmtTime = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const t = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === today.toDateString() ? `Bugün ${t}` : `${d.toLocaleDateString('tr-TR')} ${t}`;
};

function linkify(text) {
  const out = [];
  const re = /https?:\/\/[^\s<>"]+/g;
  let last = 0; let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(h('a', { href: m[0], target: '_blank', rel: 'noopener noreferrer' }, m[0]));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ------------------------------------------------------------ Şifreleme (AES-GCM, tarayıcıda)
const enc = new TextEncoder(); const dec = new TextDecoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pass) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('discord-panel-e2e-v1'), iterations: 250000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptText(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, S.key, enc.encode(text)));
  const all = new Uint8Array(iv.length + ct.length);
  all.set(iv); all.set(ct, iv.length);
  return `ENC1:${b64(all)}`;
}
async function decryptText(payload) {
  if (!S.key) return null;
  try {
    const all = unb64(payload.slice(5));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, S.key, all.slice(12));
    return dec.decode(pt);
  } catch { return null; }
}
function updateCryptoUi() {
  setIcon($('btnCrypto'), S.key && S.keyOn ? 'lock' : 'unlock');
  $('lockBadge').hidden = !(S.key && S.keyOn);
}
async function restoreKey() {
  const p = sessionStorage.getItem('e2e-pass');
  if (!p || !crypto.subtle) return;
  S.key = await deriveKey(p); S.keyOn = true; updateCryptoUi();
}

// ------------------------------------------------------------ Sunucu ve kanal listesi
function renderGuilds() {
  const totalUnread = Object.values(S.unread).reduce((a, b) => a + b, 0);
  const home = h('button', {
    class: `guild home${S.mode === 'home' ? ' active' : ''}`, title: 'Arkadaşlar ve özel mesajlar', 'aria-label': 'Arkadaşlar ve özel mesajlar',
    onclick: guard(selectHome),
  }, ic('message', 22), totalUnread ? h('span', { class: 'badge' }, String(totalUnread)) : null);
  $('guilds').replaceChildren(home, h('div', { class: 'guild-sep' }), ...S.guilds.map((g) =>
    h('button', {
      class: `guild${S.mode === 'guild' && g.id === S.guildId ? ' active' : ''}`, title: g.name, 'aria-label': g.name,
      onclick: () => selectGuild(g.id),
    }, g.icon ? h('img', { src: g.icon, alt: '' }) : g.name.slice(0, 2).toUpperCase())));
}

async function selectGuild(id) {
  S.mode = 'guild'; S.guildId = id; S.channelId = null; S.messages = [];
  $('btnRoles').hidden = false; $('btnAddChannel').title = 'Kanal ekle';
  $('memberSearch').hidden = false; $('btnDmVoice').hidden = true; $('btnProfile').hidden = true;
  document.body.classList.remove('menu');
  const g = S.guilds.find((x) => x.id === id);
  $('guildName').textContent = g ? g.name : '';
  renderGuilds(); renderMessages(); setChatTitle();
  await guard(loadChannels)();
  await guard(loadMembers)();
  const first = S.channels.find((c) => c.kind === 'text');
  if (first) selectChannel(first.id);
}

async function loadChannels() {
  if (!S.guildId) return;
  S.channels = await call('channels:list', { guildId: S.guildId });
  renderChannels();
}

function chRow(c) {
  const isVoice = c.kind === 'voice';
  const inVoice = S.voice && S.voice.channelId === c.id;
  const row = h('div', {
    class: `ch${c.id === S.channelId ? ' active' : ''}${inVoice ? ' active' : ''}`,
    tabindex: 0, role: 'button',
    onclick: () => (isVoice ? guard(joinVoice)(c) : selectChannel(c.id)),
    onkeydown: (e) => { if (e.key === 'Enter') e.currentTarget.click(); },
  },
  h('span', { class: 'ico' }, ic(isVoice ? 'volume' : 'hash', 18)),
  h('span', { class: 'nm' }, c.name),
  h('span', { class: 'acts' },
    h('button', { class: 'icon-btn', title: 'Yeniden adlandır', onclick: (e) => { e.stopPropagation(); renameChannel(c); } }, ic('pencil', 14)),
    h('button', { class: 'icon-btn', title: 'Sil', onclick: (e) => { e.stopPropagation(); deleteChannel(c); } }, ic('trash', 14))));
  const wrap = h('div', {}, row);
  if (isVoice && c.members && c.members.length) {
    wrap.append(h('div', { class: 'vmembers' }, c.members.map((m) =>
      h('div', { class: S.speaking.has(m.id) ? 'talk' : '' }, `• ${m.name}`))));
  }
  return wrap;
}

function renderChannels() {
  if (S.mode === 'home') { renderContacts(); updateVoiceBar(); return; }
  const box = $('channels');
  const sorted = [...S.channels].sort((a, b) => a.position - b.position);
  const cats = sorted.filter((c) => c.kind === 'category');
  const nodes = [];
  const orphan = sorted.filter((c) => c.kind !== 'category' && !c.parentId);
  orphan.filter((c) => c.kind === 'text').forEach((c) => nodes.push(chRow(c)));
  orphan.filter((c) => c.kind === 'voice').forEach((c) => nodes.push(chRow(c)));
  cats.forEach((cat) => {
    nodes.push(h('div', { class: 'cat' },
      h('span', {}, cat.name),
      h('span', {},
        h('button', { class: 'icon-btn', title: 'Bu kategoriye kanal ekle', onclick: () => addChannelModal(cat.id) }, ic('plus', 15)),
        h('button', { class: 'icon-btn', title: 'Kategoriyi sil', onclick: () => deleteChannel(cat) }, ic('trash', 14)))));
    const kids = sorted.filter((c) => c.parentId === cat.id);
    kids.filter((c) => c.kind === 'text').forEach((c) => nodes.push(chRow(c)));
    kids.filter((c) => c.kind === 'voice').forEach((c) => nodes.push(chRow(c)));
  });
  box.replaceChildren(...nodes);
  updateVoiceBar();
}

function setChatTitle() {
  if (S.mode === 'home') {
    const u = S.contacts.find((x) => x.id === S.dmId);
    $('chatTitle').textContent = u ? `@ ${u.name}` : 'Bir arkadaş seç';
    $('msgInput').disabled = !u;
    $('msgInput').placeholder = u ? `@${u.name} kişisine mesaj yaz` : 'Mesaj yaz';
    $('btnDmVoice').hidden = !u; $('btnProfile').hidden = !u;
    return;
  }
  $('btnDmVoice').hidden = true; $('btnProfile').hidden = true;
  const c = S.channels.find((x) => x.id === S.channelId);
  $('chatTitle').textContent = c ? `# ${c.name}` : 'Bir kanal seç';
  $('msgInput').disabled = !c;
  $('msgInput').placeholder = c ? `#${c.name} kanalına mesaj yaz` : 'Mesaj yaz';
}

async function selectChannel(id) {
  S.channelId = id; S.messages = []; S.hasMore = true;
  document.body.classList.remove('menu');
  renderChannels(); setChatTitle(); renderMessages();
  await guard(async () => {
    const msgs = await call('messages:fetch', { guildId: S.guildId, channelId: id });
    if (S.channelId !== id) return;
    S.messages = msgs; S.hasMore = msgs.length >= 30;
    renderMessages(true);
  })();
  $('msgInput').focus();
}

// ------------------------------------------------------------ Mesajlar
async function renderMessages(scrollBottom) {
  const box = $('messages');
  const prevH = box.scrollHeight;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  const nodes = [];
  if (!chatOpen()) nodes.push(h('div', { class: 'empty' }, S.mode === 'home' ? 'Soldan bir arkadaş seç ya da yeni arkadaş ekle.' : 'Soldan bir kanal seç.'));
  else if (!S.messages.length) nodes.push(h('div', { class: 'empty' }, S.mode === 'home' ? 'Henüz mesaj yok. İlk mesajı sen yaz.' : 'Bu kanalda henüz mesaj yok.'));
  if (chatOpen() && S.hasMore && S.messages.length) {
    nodes.push(h('button', { class: 'more', onclick: guard(loadOlder) }, 'Daha eski mesajlar'));
  }
  let prev = null;
  for (const m of S.messages) {
    const cont = prev && prev.author.id === m.author.id && m.ts - prev.ts < 5 * 60e3;
    nodes.push(await msgNode(m, cont));
    prev = m;
  }
  box.replaceChildren(...nodes);
  if (scrollBottom || nearBottom) box.scrollTop = box.scrollHeight;
  else box.scrollTop += box.scrollHeight - prevH;
}

async function msgNode(m, cont) {
  let text = m.content; let locked = false;
  if (text.startsWith('ENC1:')) {
    const p = await decryptText(text);
    if (p == null) { text = '🔒 Şifreli mesaj (anahtar yok ya da yanlış)'; locked = true; } else text = p;
  }
  return h('div', { class: `msg${cont ? ' cont' : ''}`, 'data-id': m.id },
    h('img', { class: 'av click', src: m.author.avatar, alt: '', loading: 'lazy', onclick: guard(() => showProfile(m.author.id)) }),
    h('div', { class: 'body' },
      cont ? null : h('div', { class: 'meta' },
        h('span', { class: 'who click', style: m.author.color ? `color:${m.author.color}` : null, onclick: guard(() => showProfile(m.author.id)) }, m.author.name),
        m.author.bot ? h('span', { class: 'tag' }, 'BOT') : null,
        h('span', { class: 'time' }, fmtTime(m.ts))),
      text ? h('div', { class: `txt${locked ? ' locked' : ''}` }, linkify(text), m.edited ? h('span', { class: 'edited' }, ' (düzenlendi)') : null) : null,
      ...m.attachments.map((a) => h('div', { class: 'att' },
        a.type && a.type.startsWith('image/')
          ? h('a', { href: a.url, target: '_blank', rel: 'noopener noreferrer' }, h('img', { src: a.url, alt: a.name, loading: 'lazy' }))
          : h('a', { href: a.url, target: '_blank', rel: 'noopener noreferrer' }, ic('paperclip', 15), a.name)))),
    h('button', { class: 'del', title: 'Mesajı sil', onclick: guard(() => deleteMsg(m)) }, ic('trash', 15)));
}

async function loadOlder() {
  const first = S.messages[0];
  if (!first) return;
  const older = S.mode === 'home'
    ? await call('dm:fetch', { userId: S.dmId, before: first.id })
    : await call('messages:fetch', { guildId: S.guildId, channelId: S.channelId, before: first.id });
  S.hasMore = older.length >= 30;
  S.messages = [...older, ...S.messages];
  renderMessages();
}

async function deleteMsg(m) {
  if (!confirm('Bu mesaj Discord\'dan silinsin mi?')) return;
  if (S.mode === 'home') {
    await call('dm:delete', { userId: S.dmId, messageId: m.id });
    S.messages = S.messages.filter((x) => x.id !== m.id);
    renderMessages();
    return;
  }
  await call('message:delete', { guildId: S.guildId, channelId: m.channelId, messageId: m.id });
}

$('composer').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  const input = $('msgInput');
  let text = input.value.trim();
  if (!text || !chatOpen()) return;
  if (S.key && S.keyOn) {
    if (text.length > 1000) throw new Error('Şifreli mesaj en fazla 1000 karakter olabilir');
    text = await encryptText(text);
  }
  input.value = '';
  if (S.mode === 'home') {
    const sent = await call('dm:send', { userId: S.dmId, content: text });
    S.messages.push(sent);
    renderMessages(true);
    return;
  }
  await call('message:send', { guildId: S.guildId, channelId: S.channelId, content: text });
}));

// ------------------------------------------------------------ Kanal yönetimi
function addChannelModal(parentId) {
  const cats = S.channels.filter((c) => c.kind === 'category');
  const name = h('input', { type: 'text', maxlength: 100, placeholder: 'yeni-kanal', autofocus: true });
  const kind = h('select', {},
    h('option', { value: 'text' }, 'Yazılı kanal'),
    h('option', { value: 'voice' }, 'Sesli kanal'),
    h('option', { value: 'category' }, 'Kategori'));
  const parent = h('select', {}, h('option', { value: '' }, 'Kategorisiz'),
    cats.map((c) => h('option', { value: c.id, selected: c.id === parentId }, c.name)));
  const ok = guard(async () => {
    await call('channel:create', { guildId: S.guildId, name: name.value, kind: kind.value, parentId: parent.value || null });
    closeModal(); toast('Kanal oluşturuldu');
  });
  openModal(h('div', {},
    h('h2', {}, 'Kanal ekle'),
    h('div', { class: 'field' }, h('label', {}, 'TÜR'), kind),
    h('div', { class: 'field' }, h('label', {}, 'AD'), name),
    h('div', { class: 'field' }, h('label', {}, 'KATEGORİ'), parent),
    h('div', { class: 'actions' },
      h('button', { class: 'btn ghost', onclick: closeModal }, 'Vazgeç'),
      h('button', { class: 'btn', onclick: ok }, 'Oluştur'))));
}
$('btnAddChannel').onclick = () => (S.mode === 'home' ? addFriendModal() : S.guildId && addChannelModal(null));

function renameChannel(c) {
  const name = h('input', { type: 'text', value: c.name, maxlength: 100 });
  openModal(h('div', {},
    h('h2', {}, 'Kanalı yeniden adlandır'),
    h('div', { class: 'field' }, name),
    h('div', { class: 'actions' },
      h('button', { class: 'btn ghost', onclick: closeModal }, 'Vazgeç'),
      h('button', {
        class: 'btn',
        onclick: guard(async () => { await call('channel:rename', { guildId: S.guildId, channelId: c.id, name: name.value }); closeModal(); }),
      }, 'Kaydet'))));
}

function deleteChannel(c) {
  openModal(h('div', {},
    h('h2', {}, `"${c.name}" silinsin mi?`),
    h('p', { class: 'note' }, 'Bu işlem Discord sunucusundan kalıcı olarak siler ve geri alınamaz.'),
    h('div', { class: 'actions' },
      h('button', { class: 'btn ghost', onclick: closeModal }, 'Vazgeç'),
      h('button', {
        class: 'btn red',
        onclick: guard(async () => {
          await call('channel:delete', { guildId: S.guildId, channelId: c.id });
          if (S.channelId === c.id) { S.channelId = null; S.messages = []; renderMessages(); setChatTitle(); }
          closeModal(); toast('Silindi');
        }),
      }, 'Sil'))));
}

// ------------------------------------------------------------ Roller
const PERM_LABELS = {
  Administrator: 'Yönetici', ManageChannels: 'Kanalları yönet', ManageRoles: 'Rolleri yönet',
  ManageMessages: 'Mesajları yönet', KickMembers: 'Üyeleri at', BanMembers: 'Üyeleri yasakla',
  ViewChannel: 'Kanalları gör', SendMessages: 'Mesaj gönder', Connect: 'Sese bağlan', Speak: 'Konuş',
};

async function rolesModal(selectedId) {
  S.roles = await call('roles:list', { guildId: S.guildId });
  const sel = S.roles.find((r) => r.id === selectedId) || S.roles[0];
  const list = h('div', { class: 'rlist' },
    h('button', { class: 'btn', style: 'width:100%;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px', onclick: guard(async () => {
      const r = await call('role:create', { guildId: S.guildId, name: 'Yeni rol', color: '#5865f2', perms: ['ViewChannel', 'SendMessages', 'Connect', 'Speak'] });
      rolesModal(r.id);
    }) }, ic('plus', 16), 'Yeni rol'),
    S.roles.map((r) => h('div', { class: `ritem${sel && r.id === sel.id ? ' active' : ''}`, onclick: () => rolesModal(r.id) },
      h('span', { class: 'rdot', style: `background:${r.color === '#000000' ? '#99aab5' : r.color}` }),
      h('span', {}, r.everyone ? '@everyone' : r.name))));
  let editor = h('p', { class: 'note' }, 'Düzenlemek için bir rol seç.');
  if (sel) {
    const name = h('input', { type: 'text', value: sel.name, maxlength: 100, disabled: sel.everyone });
    const color = h('input', { type: 'color', value: sel.color, disabled: sel.everyone });
    const hoist = h('input', { type: 'checkbox', checked: sel.hoist, disabled: sel.everyone });
    const checks = Object.entries(PERM_LABELS).map(([k, label]) =>
      h('label', {}, h('input', { type: 'checkbox', 'data-p': k, checked: sel.perms.includes(k) }), label));
    editor = h('div', {},
      h('div', { class: 'field' }, h('label', {}, 'ROL ADI'), name),
      h('div', { class: 'field' }, h('label', {}, 'RENK'), color),
      h('div', { class: 'field' }, h('label', { class: 'chk' }, hoist, 'Üyeleri ayrı listele')),
      h('div', { class: 'field' }, h('label', {}, 'YETKİLER'), h('div', { class: 'perms' }, checks)),
      sel.managed ? h('p', { class: 'note' }, 'Bu rol bir bota ya da entegrasyona ait; yalnızca yetkileri değiştirilebilir.') : null,
      h('div', { class: 'actions' },
        sel.everyone ? null : h('button', { class: 'btn red', onclick: guard(async () => {
          if (!confirm(`"${sel.name}" rolü silinsin mi?`)) return;
          await call('role:delete', { guildId: S.guildId, roleId: sel.id });
          rolesModal();
        }) }, 'Rolü sil'),
        h('button', { class: 'btn', onclick: guard(async () => {
          const perms = checks.map((l) => l.querySelector('input')).filter((i) => i.checked).map((i) => i.dataset.p);
          await call('role:edit', { guildId: S.guildId, roleId: sel.id, name: name.value, color: color.value, hoist: hoist.checked, perms });
          toast('Rol kaydedildi'); rolesModal(sel.id);
        }) }, 'Kaydet')));
  }
  openModal(h('div', {},
    h('h2', {}, 'Roller'),
    h('div', { class: 'roles-grid' }, list, editor),
    h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: closeModal }, 'Kapat'))));
}
$('btnRoles').onclick = guard(() => S.guildId && rolesModal());

// ------------------------------------------------------------ Üyeler
async function loadMembers(query) {
  if (!S.guildId) return;
  S.members = await call('members:list', { guildId: S.guildId, query });
  $('memberList').replaceChildren(...S.members.map((m) =>
    h('div', { class: 'mem', tabindex: 0, onclick: guard(() => showProfile(m.id)), onkeydown: (e) => { if (e.key === 'Enter') e.currentTarget.click(); } },
      h('img', { src: m.avatar, alt: '', loading: 'lazy' }),
      h('span', { style: m.color ? `color:${m.color}` : null }, m.name))));
}
let searchT;
$('memberSearch').addEventListener('input', (e) => {
  clearTimeout(searchT);
  searchT = setTimeout(guard(() => loadMembers(e.target.value)), 350);
});

async function memberModal(m) {
  const roles = (await call('roles:list', { guildId: S.guildId })).filter((r) => !r.everyone);
  const has = new Set(m.roles);
  const rows = roles.map((r) => {
    const cb = h('input', { type: 'checkbox', checked: has.has(r.id), disabled: r.managed });
    cb.addEventListener('change', async () => {
      try {
        const now = await call('member:role', { guildId: S.guildId, userId: m.id, roleId: r.id, add: cb.checked });
        m.roles = now;
        toast(cb.checked ? 'Rol verildi' : 'Rol alındı');
      } catch (e) { cb.checked = !cb.checked; toast(e.message, true); }
    });
    return h('label', { class: 'chk' }, cb,
      h('span', { class: 'rdot', style: `background:${r.color === '#000000' ? '#99aab5' : r.color}` }), r.name);
  });
  openModal(h('div', {},
    h('h2', {}, `${m.name} – roller`),
    h('div', { class: 'memroles' }, rows.length ? rows : h('p', { class: 'note' }, 'Bu sunucuda rol yok.')),
    h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { closeModal(); loadMembers($('memberSearch').value); } }, 'Tamam'))));
}

// ------------------------------------------------------------ Şifreleme penceresi
$('btnCrypto').onclick = () => {
  if (!crypto.subtle) { toast('Şifreleme için HTTPS gerekli', true); return; }
  const pass = h('input', { type: 'password', placeholder: 'Ortak parola', autocomplete: 'off' });
  openModal(h('div', {},
    h('h2', {}, 'Mesaj şifreleme'),
    h('p', { class: 'note' }, 'Parolayla mesajlar tarayıcında AES-256 ile şifrelenir; Discord\'a şifreli metin gider. Mesajı sadece aynı parolayı giren panel çözer. Normal Discord uygulaması şifreli metni olduğu gibi gösterir. Parola sunucuya gönderilmez ve sadece bu sekmede tutulur.'),
    h('div', { class: 'field' }, h('label', {}, 'PAROLA'), pass),
    h('div', { class: 'actions' },
      S.key ? h('button', { class: 'btn red', onclick: () => {
        S.key = null; S.keyOn = false; sessionStorage.removeItem('e2e-pass'); updateCryptoUi(); closeModal(); renderMessages(); toast('Şifreleme kapatıldı');
      } }, 'Kapat') : null,
      h('button', { class: 'btn ghost', onclick: closeModal }, 'Vazgeç'),
      h('button', { class: 'btn', onclick: guard(async () => {
        if (pass.value.length < 6) throw new Error('Parola en az 6 karakter olmalı');
        S.key = await deriveKey(pass.value); S.keyOn = true;
        sessionStorage.setItem('e2e-pass', pass.value);
        updateCryptoUi(); closeModal(); renderMessages(); toast('Şifreleme açık');
      }) }, 'Uygula'))));
};

// ------------------------------------------------------------ Sesli sohbet
const WORKLET = `
class MicProc extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Int16Array(960); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      this.buf[this.n++] = s < 0 ? s * 32768 : s * 32767;
      this.e = (this.e || 0) + s * s;
      if (this.n === 960) { this.port.postMessage({ b: this.buf.buffer.slice(0), l: Math.sqrt(this.e / 960) }); this.n = 0; this.e = 0; }
    }
    return true;
  }
}
registerProcessor('mic-proc', MicProc);`;

const A = { ctx: null, stream: null, node: null, next: new Map() };

async function startAudio() {
  if (A.ctx) return;
  if (!navigator.mediaDevices) throw new Error('Mikrofon için HTTPS gerekli');
  A.ctx = new AudioContext({ sampleRate: 48000 });
  await A.ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })));
  A.stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  const src = A.ctx.createMediaStreamSource(A.stream);
  A.node = new AudioWorkletNode(A.ctx, 'mic-proc');
  A.node.port.onmessage = (e) => {
    if (S.muted || !S.voice) return;
    socket.volatile.emit('voice:mic', e.data.b);
    $('meterBar').style.width = `${Math.min(100, Math.round(e.data.l * 500))}%`;
  };
  const mute = A.ctx.createGain(); mute.gain.value = 0;
  src.connect(A.node); A.node.connect(mute); mute.connect(A.ctx.destination);
  await A.ctx.resume();
}
function stopAudio() {
  try { A.stream?.getTracks().forEach((t) => t.stop()); } catch { /* yut */ }
  try { A.ctx?.close(); } catch { /* yut */ }
  A.ctx = A.stream = A.node = null; A.next.clear();
}

async function joinVoice(c) {
  if (S.voice && S.voice.channelId === c.id) return;
  await startAudio();
  await call('voice:join', { guildId: S.guildId, channelId: c.id });
}

socket.on('voice:state', (st) => {
  S.voice = st;
  if (!st) stopAudio();
  updateVoiceBar(); renderChannels();
});

function updateVoiceBar() {
  const bar = $('voicebar');
  bar.hidden = !S.voice;
  if (S.voice) {
    const c = S.channels.find((x) => x.id === S.voice.channelId);
    const talkers = [...S.speaking.values()].join(', ');
    $('voiceName').textContent = `${c ? c.name : (S.voice.name || '')}${talkers ? ` · konuşuyor: ${talkers}` : ''}`;
  }
  $('btnMute').classList.toggle('off', S.muted);
  $('btnDeaf').classList.toggle('off', S.deaf);
}
$('btnMute').onclick = () => { S.muted = !S.muted; setIcon($('btnMute'), S.muted ? 'micoff' : 'mic'); if (S.muted) $('meterBar').style.width = '0%'; updateVoiceBar(); };
$('btnDeaf').onclick = () => { S.deaf = !S.deaf; setIcon($('btnDeaf'), S.deaf ? 'headphonesoff' : 'headphones'); updateVoiceBar(); };
$('btnLeave').onclick = guard(async () => { await call('voice:leave'); });

socket.on('voice:audio', ({ userId, buf }) => {
  if (!A.ctx || S.deaf || !buf || buf.byteLength < 2) return;
  if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {});
  const i16 = new Int16Array(buf.buffer ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : buf);
  const ab = A.ctx.createBuffer(1, i16.length, 48000);
  const f = ab.getChannelData(0);
  for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 32768;
  const src = A.ctx.createBufferSource();
  src.buffer = ab; src.connect(A.ctx.destination);
  const now = A.ctx.currentTime;
  let t = A.next.get(userId) || 0;
  if (t < now + 0.04 || t > now + 0.6) t = now + 0.08; // gecikme/tampon ayarı
  src.start(t);
  A.next.set(userId, t + ab.duration);
});

socket.on('voice:speaking', ({ userId, name, on }) => {
  if (on) S.speaking.set(userId, name || 'biri'); else S.speaking.delete(userId);
  renderChannels(); updateVoiceBar();
});

// ------------------------------------------------------------ Canlı olaylar
socket.on('message:new', async ({ guildId, message }) => {
  if (S.mode !== 'guild' || guildId !== S.guildId || message.channelId !== S.channelId) return;
  if (S.messages.some((m) => m.id === message.id)) return;
  S.messages.push(message);
  if (S.messages.length > MAX_MSGS) S.messages.splice(0, S.messages.length - MAX_MSGS);
  renderMessages();
});
socket.on('message:update', ({ message }) => {
  const i = S.messages.findIndex((m) => m.id === message.id);
  if (i >= 0) { S.messages[i] = message; renderMessages(); }
});
socket.on('message:delete', ({ id }) => {
  const n = S.messages.length;
  S.messages = S.messages.filter((m) => m.id !== id);
  if (n !== S.messages.length) renderMessages();
});
socket.on('channels:changed', ({ guildId }) => {
  if (guildId !== S.guildId) return;
  loadChannels().then(() => {
    if (S.channelId && !S.channels.some((c) => c.id === S.channelId)) {
      S.channelId = null; S.messages = []; setChatTitle(); renderMessages();
    }
  }).catch(() => {});
});
socket.on('member:changed', () => { /* liste aramada/açılışta yenilenir */ });

// RAM temizliği: sunucu temizlenir, ekrandaki eski mesajlar da atılır (Discord'daki mesajlara dokunulmaz)
socket.on('cleanup', ({ rssMb }) => {
  if (S.messages.length > KEEP_AFTER_CLEAN) {
    S.messages = S.messages.slice(-KEEP_AFTER_CLEAN);
    S.hasMore = true;
    renderMessages(true);
  }
  $('ramInfo').textContent = `RAM: ${rssMb} MB (temizlendi)`;
  toast('Bellek temizlendi');
});
socket.on('stats', ({ rssMb }) => { $('ramInfo').textContent = `RAM: ${rssMb} MB`; });

// ------------------------------------------------------------ Başlangıç
$('btnMenu').onclick = () => document.body.classList.toggle('menu');
$('btnMembers').onclick = () => $('members').classList.toggle('open');

async function init() {
  const d = await call('app:init');
  S.prefix = d.prefix; S.voice = d.voice;
  if (!d.ready) {
    $('guildName').textContent = 'Bot bağlanıyor…';
    setTimeout(guard(init), 2500);
    return;
  }
  S.bot = d.bot; S.guilds = d.guilds;
  $('botName').textContent = d.bot.name;
  $('botAvatar').src = px(d.bot.avatar);
  renderGuilds();
  S.bot.avatar = d.bot.avatar;
  if (!S.guilds.length && S.mode !== 'home') { $('guildName').textContent = 'Bot hiçbir sunucuda değil'; return; }
  if (S.mode === 'home') { renderContacts(); return; }
  if (!S.guildId || !S.guilds.some((g) => g.id === S.guildId)) await selectGuild(S.guilds[0].id);
  else { await loadChannels(); }
}

socket.on('connect', () => { guard(init)(); });
socket.on('connect_error', (e) => {
  if (e.message === 'unauthorized') location.reload();
});


// ------------------------------------------------------------ Ana sayfa: arkadaşlar ve özel mesajlar
async function selectHome() {
  S.mode = 'home'; S.channelId = null; S.messages = []; S.hasMore = true;
  $('guildName').textContent = 'Arkadaşlar';
  $('btnRoles').hidden = true; $('btnAddChannel').title = 'Arkadaş ekle';
  document.body.classList.remove('menu');
  renderGuilds(); renderContacts(); setChatTitle(); renderMessages(); renderSidePanel();
  if (S.dmId) { openDm(S.dmId); }
  if (!S.resolved && S.contacts.length) {
    S.resolved = true;
    try {
      const fresh = await call('users:resolve', { ids: S.contacts.map((c) => c.id) });
      fresh.forEach((u) => upsertContact(u));
      if (S.mode === 'home') { renderContacts(); setChatTitle(); }
    } catch { /* sessizce geç */ }
  }
}

function contactRow(c) {
  const n = S.unread[c.id] || 0;
  return h('div', {
    class: `ch${c.id === S.dmId ? ' active' : ''}`, tabindex: 0, role: 'button',
    onclick: guard(() => openDm(c.id)),
    onkeydown: (e) => { if (e.key === 'Enter') e.currentTarget.click(); },
  },
  h('img', { class: 'cav', src: c.avatar, alt: '' }),
  h('span', { class: 'nm' }, c.name),
  n ? h('span', { class: 'ubadge' }, String(n)) : null,
  h('span', { class: 'acts' },
    h('button', { class: 'icon-btn', title: 'Listeden kaldır', onclick: (e) => { e.stopPropagation(); removeContact(c); } }, ic('x', 14))));
}

function renderContacts() {
  const friends = S.contacts.filter((c) => c.friend);
  const others = S.contacts.filter((c) => !c.friend);
  const nodes = [h('div', { class: 'cat' }, h('span', {}, `Arkadaşlar (${friends.length})`),
    h('button', { class: 'icon-btn', title: 'Arkadaş ekle', onclick: addFriendModal }, ic('plus', 15)))];
  if (!friends.length) nodes.push(h('p', { class: 'note', style: 'padding:4px 8px' }, 'Henüz arkadaş yok. Yukarıdaki + ile ekle.'));
  friends.forEach((c) => nodes.push(contactRow(c)));
  if (others.length) {
    nodes.push(h('div', { class: 'cat' }, h('span', {}, 'Son konuşmalar')));
    others.forEach((c) => nodes.push(contactRow(c)));
  }
  $('channels').replaceChildren(...nodes);
}

function removeContact(c) {
  S.contacts = S.contacts.filter((x) => x.id !== c.id);
  saveContacts();
  if (S.dmId === c.id) { S.dmId = null; S.messages = []; setChatTitle(); renderMessages(); renderSidePanel(); }
  renderContacts();
}

function renderSidePanel() {
  $('memberSearch').hidden = S.mode === 'home';
  if (S.mode !== 'home') return;
  const u = S.contacts.find((x) => x.id === S.dmId);
  $('memberList').replaceChildren(u ? h('div', { class: 'dmcard' },
    h('img', { src: u.avatar, alt: '' }),
    h('h3', {}, u.name),
    h('small', {}, u.friend ? 'Arkadaş' : 'Arkadaş değil'),
    h('button', { class: 'btn', onclick: guard(() => showProfile(u.id)) }, 'Profili gör'),
    h('button', { class: 'btn', onclick: guard(startPrivateVoice) }, 'Sesli görüş')) : h('p', { class: 'note' }, 'Bir kişi seçince burada görünür.'));
}

async function openDm(id) {
  S.mode = 'home'; S.dmId = id; S.messages = []; S.hasMore = true; S.unread[id] = 0;
  document.body.classList.remove('menu');
  renderGuilds(); renderContacts(); setChatTitle(); renderMessages(); renderSidePanel();
  try {
    const msgs = await call('dm:fetch', { userId: id });
    if (S.dmId !== id) return;
    S.messages = msgs; S.hasMore = msgs.length >= 30;
    renderMessages(true);
  } catch (e) { toast(e.message, true); }
  $('msgInput').focus();
}

socket.on('dm:message', ({ user, message }) => {
  const known = S.contacts.some((c) => c.id === user.id);
  upsertContact(user, known ? undefined : false);
  if (S.mode === 'home' && S.dmId === user.id) {
    if (!S.messages.some((m) => m.id === message.id)) {
      S.messages.push(message);
      if (S.messages.length > MAX_MSGS) S.messages.splice(0, S.messages.length - MAX_MSGS);
      renderMessages();
    }
  } else {
    S.unread[user.id] = (S.unread[user.id] || 0) + 1;
    toast(`${user.name} sana mesaj gönderdi`);
    renderGuilds();
    if (S.mode === 'home') renderContacts();
  }
});

async function startPrivateVoice() {
  if (!S.dmId) return;
  const u = S.contacts.find((x) => x.id === S.dmId);
  if (!confirm(`${u ? u.name : 'Bu kişi'} için özel bir ses odası açılsın mı?\n\nDiscord botlarla birebir arama yapamaz. Bunun yerine sadece sizin görebildiğiniz geçici bir ses kanalı açılır, kişiye davet linki DM ile gönderilir. Görüşme bitince kanal silinir.`)) return;
  await startAudio();
  try {
    const r = await call('voice:private', { guildId: S.guildId, userId: S.dmId });
    toast(r.dmSent ? 'Özel oda açıldı, davet DM ile gönderildi' : `Özel oda açıldı (${r.guildName}). Davet DM ile gönderilemedi, kişiye kendin söyle.`);
  } catch (e) { if (!S.voice) stopAudio(); throw e; }
}
$('btnDmVoice').onclick = guard(startPrivateVoice);
$('btnProfile').onclick = guard(() => S.dmId && showProfile(S.dmId));

// ------------------------------------------------------------ Arkadaş ekleme
function addFriendModal() {
  const q = h('input', { type: 'text', placeholder: 'Kullanıcı adı ya da kullanıcı ID', autofocus: true });
  const res = h('div', { class: 'results' });
  const search = guard(async () => {
    if (!q.value.trim()) return;
    res.replaceChildren(h('p', { class: 'note' }, 'Aranıyor…'));
    const list = await call('users:search', { query: q.value });
    if (!list.length) { res.replaceChildren(h('p', { class: 'note' }, 'Kimse bulunamadı. Kişi botla ortak bir sunucuda olmalı; ya da ID yaz.')); return; }
    res.replaceChildren(...list.map((u) => {
      const existing = S.contacts.find((c) => c.id === u.id);
      return h('div', { class: 'mem' },
        h('img', { src: u.avatar, alt: '' }),
        h('div', { class: 'grow' }, h('span', {}, u.name), h('small', {}, `@${u.username}`)),
        h('button', { class: 'btn ghost', onclick: guard(async () => { const cur = S.contacts.find((c) => c.id === u.id); upsertContact(u, cur ? cur.friend : false); closeModal(); await selectHome(); openDm(u.id); }) }, 'Mesaj'),
        existing && existing.friend
          ? h('small', {}, 'Arkadaş')
          : h('button', { class: 'btn', onclick: (e) => { upsertContact(u, true); e.target.replaceWith(h('small', {}, 'Eklendi')); if (S.mode === 'home') renderContacts(); } }, 'Ekle'));
    }));
  });
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  openModal(h('div', {},
    h('h2', {}, 'Arkadaş ekle'),
    h('p', { class: 'note' }, 'Botun bulunduğu sunuculardaki kişileri kullanıcı adıyla ya da herhangi birini ID ile bulabilirsin. Bu liste panele özeldir; Discord\'daki gerçek arkadaş listene dokunmaz.'),
    h('div', { class: 'field' }, q),
    h('div', { class: 'actions', style: 'margin-top:0' },
      h('button', { class: 'btn ghost', onclick: closeModal }, 'Kapat'),
      h('button', { class: 'btn', onclick: search }, 'Ara')),
    res));
  q.focus();
}

// ------------------------------------------------------------ Profil görüntüleme / düzenleme
const fmtDate = (ts) => new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

async function showProfile(userId) {
  const p = await call('profile:get', { userId, guildId: S.mode === 'guild' ? S.guildId : null });
  const isMe = S.bot && p.id === S.bot.id;
  const banner = h('div', { class: 'pbanner' });
  if (p.banner && p.banner.startsWith('https://cdn.discordapp.com/')) banner.style.backgroundImage = `url("${px(p.banner)}")`;
  else banner.style.background = p.accent || '#5865f2';
  const contact = S.contacts.find((c) => c.id === p.id);
  const sections = [];
  if (isMe) sections.push(h('div', { class: 'psec' }, h('h4', {}, 'Hakkımda'), h('p', {}, p.about || 'Henüz bir şey yazılmamış.')));
  const info = [h('p', {}, `Discord'a katılma: ${fmtDate(p.created)}`)];
  if (p.member) {
    if (p.member.joined) info.push(h('p', {}, `${p.member.guildName} sunucusuna katılma: ${fmtDate(p.member.joined)}`));
    if (p.member.nick) info.push(h('p', {}, `Sunucudaki takma ad: ${p.member.nick}`));
  }
  sections.push(h('div', { class: 'psec' }, h('h4', {}, 'Üyelik'), ...info));
  if (p.member && p.member.roles.length) {
    sections.push(h('div', { class: 'psec' }, h('h4', {}, 'Roller'),
      h('div', { class: 'chips' }, p.member.roles.map((r) =>
        h('span', { class: 'chip' }, h('span', { class: 'rdot', style: `background:${r.color === '#000000' ? '#99aab5' : r.color}` }), r.name)))));
  }
  const actions = [];
  if (isMe) {
    actions.push(h('button', { class: 'btn', onclick: () => editProfileModal(p) }, 'Profili düzenle'));
  } else {
    if (!p.bot) {
      actions.push(h('button', { class: 'btn', onclick: guard(async () => {
        upsertContact({ id: p.id, name: p.name, avatar: p.avatar }, contact ? contact.friend : false);
        closeModal(); await selectHome(); openDm(p.id);
      }) }, 'Mesaj gönder'));
      actions.push(contact && contact.friend
        ? h('button', { class: 'btn ghost', onclick: () => { upsertContact({ id: p.id, name: p.name, avatar: p.avatar }, false); toast('Arkadaşlardan çıkarıldı'); showProfile(p.id).catch(() => {}); if (S.mode === 'home') renderContacts(); } }, 'Arkadaşlıktan çıkar')
        : h('button', { class: 'btn ghost', onclick: () => { upsertContact({ id: p.id, name: p.name, avatar: p.avatar }, true); toast('Arkadaş eklendi'); showProfile(p.id).catch(() => {}); if (S.mode === 'home') renderContacts(); } }, 'Arkadaş ekle'));
    }
    if (p.member && S.mode === 'guild') {
      actions.push(h('button', { class: 'btn ghost', onclick: guard(() => memberModal({ id: p.id, name: p.name, roles: p.member.roles.map((r) => r.id) })) }, 'Rolleri düzenle'));
    }
  }
  actions.push(h('button', { class: 'btn ghost', onclick: closeModal }, 'Kapat'));
  openModal(h('div', {},
    h('div', { class: 'pcard' }, banner, h('img', { class: 'pavatar', src: p.avatar, alt: '' })),
    h('div', { class: 'pbody' },
      h('h2', {}, p.name, ' ', p.bot ? h('span', { class: 'tag', style: 'font-size:11px;background:var(--blurple);color:#fff;border-radius:3px;padding:1px 4px;vertical-align:middle' }, 'BOT') : null),
      h('div', { class: 'un' }, `@${p.username} · ID: ${p.id}`),
      ...sections),
    h('div', { class: 'actions' }, actions)));
}

// Resmi kırpıp küçült (RAM ve Discord sınırları için)
async function fileToDataUri(file, w, hgt, type, q) {
  const bmp = await createImageBitmap(file);
  const c = document.createElement('canvas'); c.width = w; c.height = hgt;
  const ctx = c.getContext('2d');
  const scale = Math.max(w / bmp.width, hgt / bmp.height);
  const dw = bmp.width * scale; const dh = bmp.height * scale;
  ctx.drawImage(bmp, (w - dw) / 2, (hgt - dh) / 2, dw, dh);
  return c.toDataURL(type, q);
}

function editProfileModal(p) {
  const username = h('input', { type: 'text', value: p.username, maxlength: 32 });
  const about = h('textarea', { maxlength: 400, placeholder: 'Kendini kısaca anlat' }, p.about || '');
  const avatarIn = h('input', { type: 'file', accept: 'image/*' });
  const bannerIn = h('input', { type: 'file', accept: 'image/*' });
  const avPrev = h('img', { class: 'prev', alt: '', hidden: true });
  const bnPrev = h('img', { class: 'prev', alt: '', hidden: true });
  let avatarData = null; let bannerData = null;
  avatarIn.addEventListener('change', guard(async () => {
    if (!avatarIn.files[0]) return;
    avatarData = await fileToDataUri(avatarIn.files[0], 256, 256, 'image/png'); avPrev.src = avatarData; avPrev.hidden = false;
  }));
  bannerIn.addEventListener('change', guard(async () => {
    if (!bannerIn.files[0]) return;
    bannerData = await fileToDataUri(bannerIn.files[0], 680, 240, 'image/jpeg', 0.85); bnPrev.src = bannerData; bnPrev.hidden = false;
  }));
  const guildSel = h('select', {}, S.guilds.map((g) => h('option', { value: g.id, selected: g.id === S.guildId }, g.name)));
  const nick = h('input', { type: 'text', maxlength: 32, placeholder: 'Boş bırakırsan takma ad kalkar' });
  openModal(h('div', {},
    h('h2', {}, 'Profili düzenle'),
    h('p', { class: 'note' }, 'Bu, botun profilidir. Mesajların bu isim ve resimle görünür. Discord kullanıcı adı değişimini saatte en fazla 2 kez yapmana izin verir.'),
    h('div', { class: 'field' }, h('label', {}, 'KULLANICI ADI'), username),
    h('div', { class: 'field' }, h('label', {}, 'HAKKIMDA'), about),
    h('div', { class: 'field' }, h('label', {}, 'PROFİL RESMİ'), avatarIn, avPrev),
    h('div', { class: 'field' }, h('label', {}, 'AFİŞ (BANNER)'), bannerIn, bnPrev),
    h('div', { class: 'actions' },
      h('button', { class: 'btn ghost', onclick: closeModal }, 'Vazgeç'),
      h('button', { class: 'btn', onclick: guard(async () => {
        const r = await call('me:update', { username: username.value, about: about.value, avatar: avatarData, banner: bannerData });
        S.bot.name = r.profile.name; S.bot.avatar = r.profile.avatar;
        $('botName').textContent = r.profile.name; $('botAvatar').src = px(r.profile.avatar);
        if (r.errors.length) toast(r.errors.join(' | '), true); else toast('Profil kaydedildi');
        showProfile(S.bot.id);
      }) }, 'Kaydet')),
    S.guilds.length ? h('div', { class: 'psec' },
      h('h4', {}, 'SUNUCUDAKİ TAKMA AD'),
      h('div', { class: 'field' }, guildSel),
      h('div', { class: 'field' }, nick),
      h('button', { class: 'btn', onclick: guard(async () => {
        await call('me:nick', { guildId: guildSel.value, nick: nick.value });
        toast('Takma ad güncellendi');
      }) }, 'Takma adı kaydet')) : null));
}
$('botAvatar').onclick = guard(() => S.bot && showProfile(S.bot.id));

restoreKey();
