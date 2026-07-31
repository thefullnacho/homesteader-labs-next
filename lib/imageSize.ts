import { readFileSync } from 'fs';
import path from 'path';

/**
 * Intrinsic pixel dimensions for an image in /public, read from its header.
 *
 * Exists so the MDX renderer can set width and height, which is what stops the
 * page reflowing as photographs load. Server-side and build-time only: notes
 * are statically generated, so every lookup happens once during the build.
 *
 * Deliberately not sharp, which is async and cannot be awaited from inside a
 * synchronous MDX component override, and deliberately not a new dependency for
 * what amounts to reading two well-documented headers. Only JPEG and PNG are
 * parsed because those are the only formats the archive uses. Anything else
 * returns null, and the renderer then omits the attributes rather than guessing,
 * since wrong dimensions distort the image where absent ones merely fail to
 * reserve space.
 */

export interface ImageSize {
  width: number;
  height: number;
}

// One read per file per build, not per page that renders it.
const cache = new Map<string, ImageSize | null>();

function parsePng(buffer: Buffer): ImageSize | null {
  // 8-byte signature, then a length + "IHDR", then width and height as big-endian uint32.
  const signature = buffer.subarray(0, 8);
  if (!signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return null;
  }
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** SOF markers carry the frame size. C4, C8 and CC are other things sharing the range. */
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function parseJpeg(buffer: Buffer): ImageSize | null {
  if (buffer.readUInt16BE(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset < buffer.length - 9) {
    // Segments are 0xFF then a marker byte; padding 0xFF bytes are legal between them.
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }

    const length = buffer.readUInt16BE(offset + 2);
    if (isStartOfFrame(marker)) {
      // length, then 1 byte of sample precision, then height and width.
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    if (length < 2) return null; // malformed; refuse rather than loop forever
    offset += 2 + length;
  }

  return null;
}

/**
 * @param src Site-root-relative path as written in MDX, e.g. /images/pokeweed-stem.jpg
 * @returns Dimensions, or null when the file is missing or not a parsable format.
 */
export function getImageSize(src: string): ImageSize | null {
  if (cache.has(src)) return cache.get(src)!;

  let size: ImageSize | null = null;
  try {
    // Only local public assets. A remote src has no file to read.
    if (src.startsWith('/')) {
      const buffer = readFileSync(path.join(process.cwd(), 'public', src));
      const extension = path.extname(src).toLowerCase();
      if (extension === '.png') size = parsePng(buffer);
      else if (extension === '.jpg' || extension === '.jpeg') size = parseJpeg(buffer);
    }
  } catch {
    // A missing file is not worth failing a build over; the image just ships
    // without dimensions, exactly as it did before.
    size = null;
  }

  cache.set(src, size);
  return size;
}
