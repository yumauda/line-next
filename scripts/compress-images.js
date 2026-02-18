import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import imageminWebp from 'imagemin-webp';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const SRC_DIR = path.resolve('src/images');
const OUT_DIR = path.resolve('images');
const MANIFEST_PATH = path.resolve('.image-cache.json');

async function loadManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.files && typeof parsed.files === 'object') {
      return parsed;
    }
    return { files: {} };
  } catch {
    return { files: {} };
  }
}

async function saveManifest(manifest) {
  const json = JSON.stringify(manifest, null, 2) + '\n';
  await fs.writeFile(MANIFEST_PATH, json, 'utf-8');
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isInsideDir(childAbs, parentAbs) {
  const rel = path.relative(parentAbs, childAbs);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

async function sha1File(absPath) {
  const buf = await fs.readFile(absPath);
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function getPluginsForOriginal(ext) {
  if (ext === '.jpg' || ext === '.jpeg') return [imageminMozjpeg({ quality: 80 })];
  if (ext === '.png') return [imageminPngquant({ quality: [0.65, 0.9] })];
  if (ext === '.svg') {
    return [
      imageminSvgo({
        plugins: [{ name: 'removeViewBox', active: false }]
      })
    ];
  }
  return [];
}

async function ensureDir(absDir) {
  await fs.mkdir(absDir, { recursive: true });
}

async function fileExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function processOneSource(absSrcPath, manifest) {
  const stat = await fs.stat(absSrcPath);
  if (!stat.isFile()) return { processed: false, reason: 'not-file' };

  const ext = path.extname(absSrcPath).toLowerCase();
  const supported = new Set(['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']);
  if (!supported.has(ext)) return { processed: false, reason: 'unsupported' };

  const relFromSrc = toPosix(path.relative(SRC_DIR, absSrcPath));
  const outAbs = path.join(OUT_DIR, relFromSrc);
  const canGenerateWebp = ext === '.jpg' || ext === '.jpeg' || ext === '.png';
  const outWebpAbs = canGenerateWebp ? outAbs.replace(/\.(jpe?g|png)$/i, '.webp') : null;

  const prev = manifest.files[relFromSrc];
  if (prev && prev.size === stat.size && prev.mtimeMs === stat.mtimeMs) {
    const hasOut = await fileExists(outAbs);
    const hasWebp = outWebpAbs ? await fileExists(outWebpAbs) : true;
    if (hasOut && hasWebp) return { processed: false, reason: 'cached' };
  }

  const hash = await sha1File(absSrcPath);
  if (prev && prev.hash === hash) {
    const hasOut = await fileExists(outAbs);
    const hasWebp = outWebpAbs ? await fileExists(outWebpAbs) : true;
    if (hasOut && hasWebp) {
      manifest.files[relFromSrc] = {
        ...prev,
        hash,
        size: stat.size,
        mtimeMs: stat.mtimeMs
      };
      return { processed: false, reason: 'cached' };
    }

    manifest.files[relFromSrc] = {
      ...prev,
      hash,
      size: stat.size,
      mtimeMs: stat.mtimeMs
    };
  }

  const outDir = path.dirname(outAbs);
  await ensureDir(outDir);

  if (ext === '.gif' || ext === '.webp') {
    await fs.copyFile(absSrcPath, outAbs);
  } else {
    await imagemin([absSrcPath], {
      destination: outDir,
      plugins: getPluginsForOriginal(ext)
    });
  }

  if (canGenerateWebp) {
    await imagemin([absSrcPath], {
      destination: outDir,
      plugins: [imageminWebp({ quality: 80 })]
    });
  }

  manifest.files[relFromSrc] = {
    hash,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    webp: canGenerateWebp
  };

  return { processed: true, reason: 'updated' };
}

async function getSourceFilesFromArgs(args) {
  const abs = args.map(p => path.resolve(p));
  const uniq = Array.from(new Set(abs));
  const onlyInSrc = uniq.filter(p => isInsideDir(p, SRC_DIR));
  return onlyInSrc;
}

async function compressImages() {
  const manifest = await loadManifest();
  const args = process.argv.slice(2).filter(Boolean);

  const targets =
    args.length > 0
      ? await getSourceFilesFromArgs(args)
      : await glob('src/images/**/*.{jpg,jpeg,png,gif,svg,webp}', { absolute: true, nodir: true });

  if (targets.length === 0) {
    console.log('No images to process.');
    return;
  }

  let processedCount = 0;
  for (const absSrc of targets) {
    const res = await processOneSource(absSrc, manifest);
    if (res.processed) processedCount += 1;
  }

  await saveManifest(manifest);
  console.log(`✓ Image processing complete! Updated ${processedCount} file(s).`);
}

compressImages().catch(error => {
  console.error('Error compressing images:', error);
  process.exit(1);
});
