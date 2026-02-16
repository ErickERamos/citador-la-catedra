/**
 * Generate minimal PNG icons for the Chrome extension.
 * Creates solid primary-blue squares with a white quote mark approximation.
 * No dependencies required -- uses raw PNG generation.
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

function createPng(width, height, r, g, b) {
  // Build raw pixel data (RGBA) with filter byte per row
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;

      // Rounded corner check
      const cornerRadius = Math.floor(width * 0.18);
      const isOutsideCorner = isOutsideRoundedRect(x, y, width, height, cornerRadius);

      if (isOutsideCorner) {
        // Transparent
        raw[px] = 0;
        raw[px + 1] = 0;
        raw[px + 2] = 0;
        raw[px + 3] = 0;
      } else if (y >= height * 0.80 && y <= height * 0.85 && x >= width * 0.15 && x <= width * 0.85) {
        // Cyan accent line
        raw[px] = 0x46;
        raw[px + 1] = 0xc6;
        raw[px + 2] = 0xe6;
        raw[px + 3] = 255;
      } else if (isInQuoteMark(x, y, width, height)) {
        // White quote mark area
        raw[px] = 255;
        raw[px + 1] = 255;
        raw[px + 2] = 255;
        raw[px + 3] = 255;
      } else {
        // Primary blue background
        raw[px] = r;
        raw[px + 1] = g;
        raw[px + 2] = b;
        raw[px + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = createChunk("IHDR", (() => {
    const d = Buffer.alloc(13);
    d.writeUInt32BE(width, 0);
    d.writeUInt32BE(height, 4);
    d[8] = 8; // bit depth
    d[9] = 6; // color type: RGBA
    d[10] = 0; // compression
    d[11] = 0; // filter
    d[12] = 0; // interlace
    return d;
  })());

  // IDAT chunk
  const idat = createChunk("IDAT", compressed);

  // IEND chunk
  const iend = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function isOutsideRoundedRect(x, y, w, h, r) {
  // Check four corners
  const corners = [
    { cx: r, cy: r },           // top-left
    { cx: w - r - 1, cy: r },   // top-right
    { cx: r, cy: h - r - 1 },   // bottom-left
    { cx: w - r - 1, cy: h - r - 1 }, // bottom-right
  ];
  for (const { cx, cy } of corners) {
    const inCornerRegion =
      (x < r && y < r && cx === r && cy === r) ||
      (x >= w - r && y < r && cx === w - r - 1 && cy === r) ||
      (x < r && y >= h - r && cx === r && cy === h - r - 1) ||
      (x >= w - r && y >= h - r && cx === w - r - 1 && cy === h - r - 1);
    if (inCornerRegion) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r * r) return true;
    }
  }
  return false;
}

function isInQuoteMark(x, y, w, h) {
  // Simple approximation of a quote mark in the center-upper area
  const cx = w / 2;
  const cy = h * 0.38;
  const size = w * 0.15;

  // Two small circles for open quotation mark
  const c1x = cx - size * 0.6;
  const c2x = cx + size * 0.6;

  const d1 = Math.sqrt((x - c1x) ** 2 + (y - cy) ** 2);
  const d2 = Math.sqrt((x - c2x) ** 2 + (y - cy) ** 2);

  // Circle parts
  if (d1 <= size || d2 <= size) return true;

  // Small tails below circles
  const tailTop = cy + size * 0.3;
  const tailBottom = cy + size * 1.8;
  const tailWidth = size * 0.5;

  if (y >= tailTop && y <= tailBottom) {
    if (Math.abs(x - (c1x + tailWidth * 0.3)) < tailWidth) return true;
    if (Math.abs(x - (c2x + tailWidth * 0.3)) < tailWidth) return true;
  }

  return false;
}

// Generate icons
const sizes = [16, 48, 128];
for (const size of sizes) {
  const png = createPng(size, size, 0x21, 0x40, 0x66); // Primary blue
  const path = join(iconsDir, `icon${size}.png`);
  writeFileSync(path, png);
  console.log(`Created ${path} (${png.length} bytes)`);
}

console.log("Icons generated successfully!");
