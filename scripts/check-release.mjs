import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assetNames, assertPromotion, assertSameAsset, pack, sha256, validateIdentity, verifyBundle } from './release.mjs';

const root = mkdtempSync(join(tmpdir(), 'fgts-release-'));
try {
  const dist = join(root, 'dist');
  const bundle = join(root, 'bundle');
  mkdirSync(dist);
  writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Simulador</title>');
  const manifest = { formatVersion: 1, version: '2.1.0', sha: 'a'.repeat(40), repository: 'owner/repo', lockfileSha256: sha256(Buffer.from('lock')), node: 'v24.0.0', runId: '123', runAttempt: '1', runUrl: 'https://github.com/owner/repo/actions/runs/123' };
  validateIdentity(manifest.version, manifest.sha);
  assertPromotion('2.1.0', manifest.sha, manifest);
  assertPromotion('2.10.0', manifest.sha, { ...manifest, version: '2.9.0' });
  assert.throws(() => assertPromotion('2.1.0', manifest.sha, { ...manifest, version: '2.2.0' }), /rollback/);
  assert.throws(() => assertPromotion('2.1.0', 'b'.repeat(40), manifest), /SHA diferente/);
  for (const invalid of ['v2.1.0', '02.1.0', '2.1', '2.1.0-beta', '../2.1.0']) assert.throws(() => validateIdentity(invalid, manifest.sha));
  assert.throws(() => validateIdentity('2.1.0', 'main'));
  assert.throws(() => pack(dist, bundle, manifest, '2.0.3', '2.1.0'), /Versão esperada/);
  const result = pack(dist, bundle, manifest, '2.1.0', '2.1.0');
  assert.equal(result.manifest.sha, manifest.sha);
  assert.equal(result.digest, sha256(readFileSync(join(bundle, assetNames[0]))));
  assert.throws(() => verifyBundle(bundle, '2.1.1', manifest.sha), /Manifesto incompatível/);
  assert.throws(() => verifyBundle(bundle, '2.1.0', 'b'.repeat(40)), /Manifesto incompatível/);
  const archive = readFileSync(join(bundle, 'site.tar.gz'));
  assertSameAsset('site.tar.gz', archive, Buffer.from(archive));
  assert.throws(() => assertSameAsset('site.tar.gz', archive, Buffer.from('different')), /Conflito/);
  assert.deepEqual(readFileSync(join(bundle, 'site.tar.gz')), archive, 'conflict must not change persisted bytes');
  writeFileSync(join(bundle, 'SHA256SUMS'), '0'.repeat(64));
  assert.throws(() => verifyBundle(bundle, '2.1.0', manifest.sha), /Conflito/);
  pack(dist, bundle, manifest, '2.1.0', '2.1.0');
  writeFileSync(join(bundle, 'site.tar.gz'), Buffer.concat([archive, Buffer.from('corruption')]));
  assert.throws(() => verifyBundle(bundle, '2.1.0', manifest.sha));
  console.log('Release: version, package identity, checksum and no-clobber checks passed.');
} finally {
  rmSync(root, { recursive: true, force: true });
}
