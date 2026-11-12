import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const assetNames = ['site.tar.gz', 'manifest.json', 'SHA256SUMS'];
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fail = (message) => { throw new Error(message); };

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const betaVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-beta\.(0|[1-9]\d*)$/;
export const isBetaVersion = (version) => betaVersion.test(version ?? '');

const changelogTitle = '# Changelog';
const changelogUnreleased = '## Unreleased';
const changelogSections = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
const changelogHeading = /^## (\d+\.\d+\.\d+(?:-beta\.\d+)?) - (\d{4}-\d{2}-\d{2})$/;

const compareVersions = (left, right) => {
  const [leftCore, leftPre] = left.split('-beta.');
  const [rightCore, rightPre] = right.split('-beta.');
  const core = leftCore.split('.').map(BigInt);
  const other = rightCore.split('.').map(BigInt);
  for (let index = 0; index < 3; index++) {
    if (core[index] !== other[index]) return core[index] > other[index] ? 1 : -1;
  }
  if (leftPre === undefined) return rightPre === undefined ? 0 : 1;
  if (rightPre === undefined) return -1;
  return BigInt(leftPre) === BigInt(rightPre) ? 0 : BigInt(leftPre) > BigInt(rightPre) ? 1 : -1;
};

/** Blocos "## ..." do arquivo, na ordem em que aparecem. */
function parseChangelog(markdown) {
  const blocks = [];
  let current = null;
  for (const line of String(markdown ?? '').split('\n')) {
    if (line.startsWith('## ')) {
      current = { heading: line.trim(), body: [] };
      blocks.push(current);
    } else if (current) current.body.push(line);
  }
  return blocks;
}

/** Texto da seção da versão, usado como corpo da release publicada. */
export function changelogSection(markdown, version) {
  validateIdentity(version, 'a'.repeat(40));
  const block = parseChangelog(markdown).find(
    (item) => changelogHeading.exec(item.heading)?.[1] === version,
  );
  if (!block) fail(`Seção da versão ${version} ausente no CHANGELOG.md.`);
  const text = block.body.join('\n').trim();
  if (!text) fail(`Seção da versão ${version} vazia no CHANGELOG.md.`);
  return text;
}

/** Problemas do CHANGELOG.md frente ao padrão declarado; lista vazia significa conforme. */
export function checkChangelog(markdown, version) {
  validateIdentity(version, 'a'.repeat(40));
  const problems = [];
  const text = String(markdown ?? '');
  const lines = text.split('\n');
  if (lines[0]?.trim() !== changelogTitle) problems.push(`Primeira linha deve ser "${changelogTitle}".`);
  if (/\p{Extended_Pictographic}|\uFE0F/u.test(text)) problems.push('Emojis não são permitidos.');
  const blocks = parseChangelog(text);
  const unreleased = blocks.find((block) => block.heading === changelogUnreleased);
  if (!unreleased) problems.push(`Seção "${changelogUnreleased}" ausente.`);
  const released = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => changelogHeading.test(block.heading))
    .map(({ block, index }) => {
      const match = changelogHeading.exec(block.heading);
      return { ...block, index, version: match[1], date: match[2] };
    });
  if (unreleased && released.length && blocks.indexOf(unreleased) > released[0].index)
    problems.push('"Unreleased" deve vir antes das versões publicadas.');
  for (let index = 1; index < released.length; index++) {
    if (compareVersions(released[index - 1].version, released[index].version) <= 0)
      problems.push(`Versões fora de ordem decrescente: ${released[index - 1].version} e ${released[index].version}.`);
  }
  for (const block of released) {
    const parsed = new Date(`${block.date}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== block.date)
      problems.push(`Data inválida na versão ${block.version}.`);
    const sections = block.body.filter((line) => line.startsWith('### ')).map((line) => line.slice(4).trim());
    for (const section of sections) {
      if (!changelogSections.includes(section))
        problems.push(`Seção "${section}" fora do padrão em ${block.version}.`);
    }
    if (new Set(sections).size !== sections.length) problems.push(`Seção repetida em ${block.version}.`);
    if (!block.body.some((line) => line.startsWith('- '))) problems.push(`Versão ${block.version} sem itens.`);
  }
  const own = released.filter((block) => block.version === version);
  if (own.length === 0) problems.push(`Seção da versão ${version} ausente.`);
  if (own.length > 1) problems.push(`Seção da versão ${version} duplicada.`);
  return problems;
}


export function validateIdentity(version, sha) {
  if (!stableVersion.test(version ?? '') && !isBetaVersion(version)) fail('Use versão estável MAJOR.MINOR.PATCH ou beta MAJOR.MINOR.PATCH-beta.N, sem prefixo v.');
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) fail('Informe o SHA completo de 40 caracteres.');
}

function validateStableIdentity(version, sha) {
  if (!stableVersion.test(version ?? '')) fail('Esta operação exige versão estável MAJOR.MINOR.PATCH.');
  validateIdentity(version, sha);
}

export function assertPromotion(version, sha, current) {
  validateStableIdentity(version, sha);
  validateStableIdentity(current.version, current.sha);
  const next = version.split('.').map(BigInt);
  const previous = current.version.split('.').map(BigInt);
  for (let index = 0; index < 3; index++) {
    if (next[index] < previous[index]) fail('Versão de produção mais nova; rebaixamento exige rollback explícito.');
    if (next[index] > previous[index]) return;
  }
  if (sha !== current.sha) fail('Mesma versão de produção com SHA diferente.');
}

export function checkManifest(manifest, version, sha) {
  validateIdentity(version, sha);
  if (manifest.formatVersion !== 1 || manifest.version !== version || manifest.sha !== sha
    || !/^[a-f0-9]{64}$/.test(manifest.lockfileSha256 ?? '')
    || !/^v24\./.test(manifest.node ?? '')
    || !/^\d+$/.test(manifest.runId ?? '')
    || !/^\d+$/.test(manifest.runAttempt ?? '')
    || typeof manifest.repository !== 'string') fail('Manifesto incompatível com versão/SHA/proveniência esperados.');
  return manifest;
}

export function assertSameAsset(name, actual, expected) {
  if (!actual.equals(expected)) fail(`Conflito no asset ${name}; nenhum arquivo/tag será sobrescrito.`);
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(path);
    else if (!entry.isFile() || lstatSync(path).nlink !== 1) fail(`Pacote não aceita links/arquivos especiais: ${path}`);
  }
}

function archiveManifest(archive) {
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
  for (const entry of entries) {
    if (entry.startsWith('/') || entry.includes('\\') || /[\x00-\x1f\x7f]/.test(entry)
      || entry.split('/').includes('..')) fail('Caminho inseguro no pacote.');
  }
  const types = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8' }).trim().split('\n');
  if (types.some((entry) => !['-', 'd'].includes(entry[0]))) fail('Pacote contém links/arquivos especiais.');
  if (entries.filter((entry) => entry === './release.json').length !== 1
    || !entries.includes('./index.html')) fail('Pacote precisa conter index.html e release.json únicos.');
  return JSON.parse(execFileSync('tar', ['-xOf', archive, './release.json'], { encoding: 'utf8' }));
}

export function verifyBundle(directory, version, sha) {
  const manifestBytes = readFileSync(`${directory}/manifest.json`);
  const manifest = checkManifest(JSON.parse(manifestBytes), version, sha);
  assertSameAsset('manifesto interno', Buffer.from(json(archiveManifest(`${directory}/site.tar.gz`))), manifestBytes);
  const digest = sha256(readFileSync(`${directory}/site.tar.gz`));
  const sums = `${digest}  site.tar.gz\n${sha256(manifestBytes)}  manifest.json\n`;
  assertSameAsset('SHA256SUMS', readFileSync(`${directory}/SHA256SUMS`), Buffer.from(sums));
  return { manifest, digest };
}

export function pack(directory, output, manifest, packageVersion, lockVersion) {
  checkManifest(manifest, manifest.version, manifest.sha);
  if (packageVersion !== manifest.version || lockVersion !== manifest.version) fail('Versão esperada difere de package.json/package-lock.json.');
  if (!existsSync(`${directory}/index.html`)) fail('Build sem index.html.');
  walk(directory);
  mkdirSync(output, { recursive: true });
  writeFileSync(`${directory}/release.json`, json(manifest));
  execFileSync('tar', ['--sort=name', '--mtime=@0', '--owner=0', '--group=0', '--numeric-owner', '-czf', resolve(output, 'site.tar.gz'), '-C', directory, '.']);
  writeFileSync(`${output}/manifest.json`, json(manifest));
  const sums = `${sha256(readFileSync(`${output}/site.tar.gz`))}  site.tar.gz\n${sha256(readFileSync(`${output}/manifest.json`))}  manifest.json\n`;
  writeFileSync(`${output}/SHA256SUMS`, sums);
  return verifyBundle(output, manifest.version, manifest.sha);
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
function summary(text) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

async function main(command) {
  const env = process.env;
  const version = env.EXPECTED_VERSION;
  const sha = env.EXPECTED_SHA;
  validateIdentity(version, sha);
  const operation = env.OPERATION;
  if (!['release', 'beta', 'resume', 'rollback'].includes(operation)) fail('Operação inválida.');
  if (operation === 'release' && isBetaVersion(version)) fail('Operação release exige versão estável.');
  if (operation === 'beta' && !isBetaVersion(version)) fail('Operação beta exige versão MAJOR.MINOR.PATCH-beta.N.');
  if (operation === 'rollback' && isBetaVersion(version)) fail('Rollback de Pages exige uma versão estável.');
  if (operation === 'resume' && isBetaVersion(version)) fail('Retome uma beta repetindo a operação beta.');
  if (isBetaVersion(version) && ['fetch', 'guard', 'confirm'].includes(command)) fail('Pré-release beta não pode publicar nem confirmar Pages.');
  if (env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main') fail('Publicação/recuperação somente por workflow_dispatch na branch main.');
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? '') || !/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? '')) fail('Contexto GitHub inválido.');
  // A new bundle must come from the dispatch head; recovery reuses the SHA already recorded in the draft/release.
  if (command === 'pack' && sha !== env.GITHUB_SHA) fail('Nova release exige SHA idêntico ao SHA fixado no dispatch.');
  const repository = env.GITHUB_REPOSITORY;
  const base = `https://api.github.com/repos/${repository}`;
  const tag = `v${version}`;
  const bundle = 'release-bundle';
  const headers = { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  async function request(path, { method = 'GET', body, binary = false, missing = false } = {}) {
    const url = path.startsWith('https://uploads.github.com/') ? path : `${base}/${path}`;
    const response = await fetch(url, {
      method,
      headers: { ...headers, ...(binary ? { Accept: 'application/octet-stream' } : {}), ...(body ? { 'Content-Type': Buffer.isBuffer(body) ? 'application/octet-stream' : 'application/json' } : {}) },
      ...(body ? { body: Buffer.isBuffer(body) ? body : JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(120000),
    });
    if (missing && response.status === 404) return null;
    if (!response.ok) fail(`GitHub ${method} ${path}: ${response.status} ${await response.text()}`);
    if (response.status === 204) return null;
    return binary ? Buffer.from(await response.arrayBuffer()) : response.json();
  }
  async function tagSha() {
    const ref = await request(`git/ref/tags/${tag}`, { missing: true });
    if (!ref) return null;
    let object = ref.object;
    for (let depth = 0; object.type === 'tag' && depth < 10; depth++) object = (await request(`git/tags/${object.sha}`)).object;
    if (object.type !== 'commit') fail('Tag não resolve para um commit.');
    return object.sha;
  }
  async function checkTag(required = true) {
    const actual = await tagSha();
    if ((!actual && required) || (actual && actual !== sha)) fail('Tag ausente ou aponta para SHA diferente; não será movida.');
    return actual;
  }
  async function approvedSource() {
    const comparison = await request(`compare/${sha}...${env.GITHUB_SHA}`);
    if (!['ahead', 'identical'].includes(comparison.status)) fail('SHA do pacote não pertence ao histórico aprovado de main neste dispatch.');
  }
  async function release(required = true) {
    // The tag endpoint never returns drafts; the list does, for tokens with write access.
    const found = (await request(`releases/tags/${tag}`, { missing: true })) ?? (await request('releases?per_page=100')).find((item) => item.tag_name === tag);
    if (!found && required) fail('Release não encontrada.');
    return found;
  }
  async function assetBytes(asset) {
    return request(`releases/assets/${asset.id}`, { binary: true });
  }
  async function download(found, allowDraft) {
    if (found.prerelease !== isBetaVersion(version)) fail('Canal da release incompatível com a versão solicitada.');
    if ((!allowDraft && found.draft) || (!found.draft && !found.immutable)) fail('Recuperação exige release publicada e imutável (ou draft preservada na retomada).');
    await checkTag();
    mkdirSync(bundle, { recursive: true });
    const archive = found.assets.find((asset) => asset.name === assetNames[0]);
    if (!archive) fail('Release sem pacote preservado; não é possível recuperar os mesmos bytes.');
    if (archive.size > 100 * 1024 * 1024) fail('Pacote excede limite operacional de 100 MiB.');
    writeFileSync(`${bundle}/site.tar.gz`, await assetBytes(archive));
    const manifest = checkManifest(archiveManifest(`${bundle}/site.tar.gz`), version, sha);
    if (manifest.repository !== repository) fail('Pacote pertence a outro repositório.');
    const manifestBytes = Buffer.from(json(manifest));
    const sums = Buffer.from(`${sha256(readFileSync(`${bundle}/site.tar.gz`))}  site.tar.gz\n${sha256(manifestBytes)}  manifest.json\n`);
    for (const [name, expected] of [['manifest.json', manifestBytes], ['SHA256SUMS', sums]]) {
      const asset = found.assets.find((item) => item.name === name);
      if (!asset && !found.draft) fail(`Release publicada sem ${name}.`);
      if (asset) assertSameAsset(name, await assetBytes(asset), expected);
      writeFileSync(`${bundle}/${name}`, expected);
    }
    return verifyBundle(bundle, version, sha);
  }
  if (command === 'pack') {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    const manifest = { formatVersion: 1, version, sha, repository, lockfileSha256: sha256(readFileSync('package-lock.json')), node: process.version, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT, runUrl: `${env.GITHUB_SERVER_URL}/${repository}/actions/runs/${env.GITHUB_RUN_ID}` };
    if (lock.packages?.['']?.version !== version) fail('Versão raiz do lockfile divergente.');
    pack('dist', bundle, manifest, pkg.version, lock.version);
    return;
  }
  await approvedSource();
  if (command === 'plan') {
    await checkTag(false);
    const found = await release(false);
    if (found && found.prerelease !== isBetaVersion(version)) fail('Canal da release incompatível com a versão solicitada.');
    if (found?.assets.some((asset) => asset.name === 'site.tar.gz')) {
      await download(found, operation !== 'rollback');
      output('build', 'false');
    } else {
      if (!['release', 'beta'].includes(operation) || (found && !found.draft)) fail('Não existe pacote recuperável; somente release/beta nova no SHA original pode gerar pacote.');
      if (found?.assets.length) fail('Draft inconsistente: assets existem sem site.tar.gz; intervenção humana necessária, sem clobber.');
      output('build', 'true');
    }
    return;
  }
  if (command === 'publish') {
    if (operation === 'rollback') {
      await download(await release(), false);
      summary(`Pacote existente para rollback: ${tag} (${sha}). Nenhuma release/tag alterada.`);
      return;
    }
    const { digest } = verifyBundle(bundle, version, sha);
    // Notas vêm do CHANGELOG.md preservado junto ao script; o corpo da release deixa de ser só um aviso.
    const notes = changelogSection(readFileSync('CHANGELOG.md', 'utf8'), version);
    // GITHUB_TOKEN gets 403 here (endpoint needs admin); the published release must still report immutable below.
    const immutable = await request('immutable-releases').catch(() => null);
    if (immutable && !immutable.enabled) fail('Ative imutabilidade de releases antes de publicar.');
    if (!(await checkTag(false))) await request('git/refs', { method: 'POST', body: { ref: `refs/tags/${tag}`, sha } });
    let found = await release(false);
    if (found && found.prerelease !== isBetaVersion(version)) fail('Canal da release incompatível com a versão solicitada.');
    if (!found) found = await request('releases', { method: 'POST', body: { tag_name: tag, target_commitish: sha, name: tag, draft: true, prerelease: isBetaVersion(version), make_latest: isBetaVersion(version) ? 'false' : 'true', body: `${isBetaVersion(version) ? `Pré-release beta validada de ${sha}. Não implanta no GitHub Pages.` : `Pacote validado de ${sha}. Publicação do pacote não confirma implantação no Pages.`}\n\n${notes}\n\nRecuperação: site.tar.gz + manifest.json + SHA256SUMS.` } });
    for (const name of assetNames) {
      const expected = readFileSync(`${bundle}/${name}`);
      const existing = found.assets.find((asset) => asset.name === name);
      if (existing) assertSameAsset(name, await assetBytes(existing), expected);
      else {
        if (!found.draft) fail(`Release publicada sem ${name}; não pode ser modificada.`);
        const upload = found.upload_url.replace(/\{.*$/, '');
        await request(`${upload}?name=${encodeURIComponent(name)}`, { method: 'POST', body: expected });
      }
    }
    found = await release();
    if (found.draft) found = await request(`releases/${found.id}`, { method: 'PATCH', body: { draft: false, prerelease: isBetaVersion(version), make_latest: isBetaVersion(version) ? 'false' : 'true' } });
    if (!found.immutable) fail('GitHub não confirmou release imutável; implantação bloqueada.');
    await download(found, false);
    summary(`${isBetaVersion(version) ? 'Pré-release beta' : 'Pacote'} publicado e imutável: [${tag}](${found.html_url}), SHA ${sha}, SHA-256 ${digest}. ${isBetaVersion(version) ? '**GitHub Pages não foi implantado.**' : '**Produção ainda não confirmada.**'}`);
    return;
  }
  if (command === 'fetch') {
    const { digest } = await download(await release(), false);
    output('digest', digest);
    mkdirSync('deploy-dist', { recursive: true });
    execFileSync('tar', ['-xzf', `${bundle}/site.tar.gz`, '-C', 'deploy-dist', '--no-same-owner', '--no-same-permissions']);
    return;
  }
  if (command === 'guard') {
    if (operation === 'rollback') return;
    // A Pages deployment identifies the workflow SHA, not a rollback's package SHA; fail conservatively.
    for (let page = 1; ; page++) {
      const deployments = await request(`deployments?environment=github-pages&per_page=100&page=${page}`);
      if (!deployments.length) return;
      for (const deployment of deployments) {
        const statuses = await request(`deployments/${deployment.id}/statuses?per_page=100`);
        if (!statuses.some((status) => status.state === 'success')) continue;
        const comparison = await request(`compare/${deployment.sha}...${sha}`);
        if (!['ahead', 'identical'].includes(comparison.status)) fail('Produção já recebeu workflow mais novo. Rebaixamento exige operação explícita rollback; resume não pode rebaixar.');
        const pages = await request('pages');
        const identityUrl = new URL('release.json', pages.html_url.endsWith('/') ? pages.html_url : `${pages.html_url}/`);
        identityUrl.searchParams.set('run', env.GITHUB_RUN_ID);
        const response = await fetch(identityUrl, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (response.status === 404) {
          const modernWorkflow = await request(`contents/.github/workflows/release.yml?ref=${deployment.sha}`, { missing: true });
          if (modernWorkflow) fail('Produção sem identidade pública verificável; inspecione antes de retomar.');
        } else {
          if (!response.ok) fail('Falha ao consultar versão de produção; implantação bloqueada.');
          assertPromotion(version, sha, await response.json());
        }
        return;
      }
    }
  }
  if (command === 'confirm') {
    const pages = await request('pages');
    const url = new URL('release.json', pages.html_url.endsWith('/') ? pages.html_url : `${pages.html_url}/`);
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        url.searchParams.set('run', `${env.GITHUB_RUN_ID}-${attempt}`);
        const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (response.ok) {
          const actual = await response.json();
          if (actual.version === version && actual.sha === sha) {
            summary(`Produção confirmada: ${tag}, pacote SHA ${sha}, operação **${operation}**, [Pages](${pages.html_url}). Rollback não altera o histórico local/IndexedDB nem atualiza clientes offline imediatamente.`);
            return;
          }
        }
      } catch { /* CDN may not expose the completed deployment immediately. */ }
      await new Promise((done) => setTimeout(done, 10000));
    }
    fail('Deploy Pages terminou, mas identidade pública não foi confirmada. Não tratar como produção verificada; inspecione antes de retomar.');
  }
  fail(`Comando desconhecido: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
