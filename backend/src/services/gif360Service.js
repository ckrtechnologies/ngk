import axios from 'axios';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for decoded 360 frames
const framesCache = new Map();

// Load omggif
let GifReaderClass = null;
try {
  const localOmggif = path.resolve(__dirname, 'omggif.js');
  const omggifContent = fs.readFileSync(localOmggif, 'utf8');
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', omggifContent);
  fn(mod, mod.exports);
  GifReaderClass = mod.exports.GifReader;
} catch (e) {
  console.warn('Could not load omggif:', e.message);
}

// CRC32 table for PNG encoding
const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}

function calcCrc(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calcCrc(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const lineLength = width * 4 + 1;
  const filtered = Buffer.alloc(lineLength * height);
  for (let y = 0; y < height; y++) {
    filtered[y * lineLength] = 0;
    rgba.copy(filtered, y * lineLength + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idatData = zlib.deflateSync(filtered, { level: 4 });

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idatData),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

export const extract360Frames = async (gifUrl) => {
  if (!gifUrl) throw new Error('gifUrl is required');

  if (framesCache.has(gifUrl)) {
    return framesCache.get(gifUrl);
  }

  if (!GifReaderClass) {
    throw new Error('GifReader engine not initialized');
  }

  const resp = await axios.get(gifUrl, { responseType: 'arraybuffer', timeout: 10000 });
  const reader = new GifReaderClass(Buffer.from(resp.data));
  const numFrames = reader.numFrames();
  const width = reader.width;
  const height = reader.height;

  const pixels = Buffer.alloc(width * height * 4);
  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    reader.decodeAndBlitFrameRGBA(i, pixels);
    const png = encodePNG(width, height, pixels);
    frames.push(`data:image/png;base64,${png.toString('base64')}`);
  }

  const result = {
    totalFrames: numFrames,
    width,
    height,
    frames,
  };

  framesCache.set(gifUrl, result);
  return result;
};

export default {
  extract360Frames,
};
