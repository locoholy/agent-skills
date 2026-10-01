#!/usr/bin/env node
/*
 * upstream.mjs — keep the third-party skills in this repo honest.
 *
 *   node scripts/upstream.mjs check            # are our copies the pinned upstream text? has upstream moved?
 *   node scripts/upstream.mjs update <name>    # take upstream's current text, keep our frontmatter, re-pin
 *   node scripts/upstream.mjs update --all
 *
 * Needs network access to api.github.com. Auth: GITHUB_TOKEN, or `gh auth token`
 * when the gh CLI is installed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'upstream.json');
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

/* ---------- GitHub ---------- */
function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try { return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim(); }
  catch { return null; }
}
const TOKEN = token();
function headers(accept) {
  const h = { 'user-agent': 'agent-skills-upstream', accept: accept || 'application/vnd.github+json' };
  if (TOKEN) h.authorization = 'Bearer ' + TOKEN;
  return h;
}
async function api(url) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}${TOKEN ? '' : ' (no token: set GITHUB_TOKEN or install gh)'}`);
  return res;
}
async function rawFile(repo, file, ref) {
  const res = await api(`https://api.github.com/repos/${repo}/contents/${file}?ref=${encodeURIComponent(ref)}`);
  return Buffer.from((await res.json()).content, 'base64').toString('utf8');
}
async function lastCommit(repo, file) {
  const j = await (await api(`https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(file)}&per_page=1`)).json();
  return j[0] ? j[0].sha : null;
}
/* A file upstream deleted still has a newest commit — the one that removed it,
 * where fetching the path is a 404. Walk back to the last revision that exists,
 * and separately ask whether the path is still there on the default branch. */
async function currentRevision(repo, file) {
  const list = await (await api(`https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(file)}&per_page=30`)).json();
  for (const c of list) {
    try { return { sha: c.sha.slice(0, 7), text: await rawFile(repo, file, c.sha), deleted: false }; }
    catch (e) { if (!/HTTP 404/.test(e.message)) throw e; }
  }
  return null;
}
async function deletedUpstream(repo, file) {
  try { await api(`https://api.github.com/repos/${repo}/contents/${file}`); return false; }
  catch (e) { return /HTTP 404/.test(e.message); }
}

/* ---------- skill text ---------- */
/* Frontmatter is ours; the body is upstream's. Everything here compares and
 * replaces only the body, so a re-pin can never clobber our name or version. */
function split(text) {
  if (!text.startsWith('---')) return { front: '', body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { front: '', body: text };
  return { front: text.slice(0, end + 4), body: text.slice(end + 4) };
}
const bodyOf = (text) => split(text).body.replace(/^\s+|\s+$/g, '') + '\n';
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const local = (rel) => path.join(ROOT, rel);

function setUpstreamBlock(front, repo, file, commit) {
  const block = ['  upstream:', `    repo: ${repo}`, `    path: ${file}`, `    commit: ${commit}`];
  const lines = front.split('\n');
  const mi = lines.findIndex((l) => /^metadata:\s*$/.test(l));
  if (mi < 0) {
    // No metadata block: add one before the closing ---.
    const close = lines.length - 1;
    return [...lines.slice(0, close), 'metadata:', ...block, ...lines.slice(close)].join('\n');
  }
  let end = mi + 1;
  while (end < lines.length && /^\s+\S/.test(lines[end])) end++;
  const kept = lines.slice(mi + 1, end).filter((l) => !/^\s+upstream:\s*$/.test(l) && !/^\s{4,}(repo|path|commit):/.test(l));
  return [...lines.slice(0, mi + 1), ...kept, ...block, ...lines.slice(end)].join('\n');
}

/* ---------- commands ---------- */
function vendored() { return manifest.skills.filter((s) => s.mode === 'vendored'); }

async function check() {
  let bad = 0;
  for (const sk of vendored()) {
    const text = readFileSync(local(sk.file), 'utf8');
    const ours = bodyOf(text);
    const pinned = bodyOf(await rawFile(sk.repo, sk.path, sk.pinned));
    const same = sha(ours) === sha(pinned);
    if (!same) bad++;
    const gone = await deletedUpstream(sk.repo, sk.path);
    const cur = await currentRevision(sk.repo, sk.path);
    let note;
    if (!cur) {
      note = 'could not read upstream';
      bad++;
    } else {
      const sameText = sha(bodyOf(cur.text)) === sha(pinned);
      if (gone) {
        note = sameText
          ? `upstream deleted the file (last revision ${cur.sha}) — pinned text is final and matches it`
          : `upstream deleted the file; last revision ${cur.sha} differs from our pinned ${sk.pinned}`;
      } else {
        note = sameText
          ? `current ${cur.sha} (same text as pinned)`
          : `UPDATE AVAILABLE: ${cur.sha} differs from pinned ${sk.pinned} — node scripts/upstream.mjs update ${sk.name}`;
      }
      if (!sameText) bad++;
    }
    console.log(`${same ? 'match  ' : 'DIFFERS'}  ${sk.name.padEnd(22)} pinned ${sk.pinned}  ${note}`);
    if (!same) console.log(`         our body differs from the pinned upstream text — run: node scripts/upstream.mjs update ${sk.name}`);
  }
  for (const sk of manifest.skills.filter((s) => s.mode === 'linked')) {
    const head = await lastCommit(sk.repo, sk.path);
    console.log(`linked   ${sk.name.padEnd(22)} ${sk.repo} @ ${head ? head.slice(0, 7) : '?'}  (install: ${sk.install})`);
  }
  for (const sk of manifest.skills.filter((s) => s.mode === 'external')) {
    const want = (await (await fetch(sk.latestCheck.url)).json())[sk.latestCheck.field];
    const stale = want !== sk.pinnedVersion;
    if (stale) bad++;
    console.log(`external ${sk.name.padEnd(22)} installed ${sk.pinnedVersion}  latest ${want}${stale ? `  → run: ${sk.installer}` : '  (up to date)'}`);
  }
  console.log(bad ? `\n${bad} item(s) need attention` : '\neverything in sync');
  process.exit(bad ? 1 : 0);
}

async function update(names) {
  for (const sk of vendored()) {
    if (!names.includes(sk.name)) continue;
    const cur = await currentRevision(sk.repo, sk.path);
    if (!cur) { console.error(`no upstream revision found for ${sk.name}`); process.exit(1); }
    const upstream = bodyOf(cur.text);
    const { front } = split(readFileSync(local(sk.file), 'utf8'));
    const next = setUpstreamBlock(front, sk.repo, sk.path, cur.sha) + '\n' + upstream;
    writeFileSync(local(sk.file), next);
    sk.pinned = cur.sha;
    console.log(`updated ${sk.name} → ${sk.repo}@${cur.sha} (${upstream.length}b body); review the diff before committing`);
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'check') await check();
else if (cmd === 'update') {
  const names = arg === '--all' || !arg ? vendored().map((s) => s.name) : [arg];
  const known = vendored().map((s) => s.name);
  const unknown = names.filter((n) => !known.includes(n));
  if (unknown.length) { console.error(`not a vendored skill: ${unknown.join(', ')} (known: ${known.join(', ')})`); process.exit(2); }
  await update(names);
} else {
  console.log('usage: node scripts/upstream.mjs check | update <name> | update --all');
  process.exit(2);
}
