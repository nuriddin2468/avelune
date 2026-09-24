// Minimal sfnt (TrueType/OpenType) reading and writing: enough to replace the `name` table of a subset and rebuild
// the file with correct checksums (OpenType spec, "Font file" and "name" chapters).

export interface Sfnt {
  readonly version: number;
  /** Tables in file order. */
  readonly tables: ReadonlyMap<string, Uint8Array>;
}

export interface NameRecord {
  readonly platformId: number;
  readonly encodingId: number;
  readonly languageId: number;
  readonly nameId: number;
  readonly text: string;
}

export function readSfnt(font: Uint8Array): Sfnt {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const version = view.getUint32(0);
  if (version !== 0x00010000 && version !== 0x4f54544f) throw new Error('not a TrueType or OpenType font');
  const count = view.getUint16(4);
  const tables = new Map<string, Uint8Array>();
  for (let index = 0; index < count; index++) {
    const record = 12 + index * 16;
    const tag = String.fromCharCode(...font.subarray(record, record + 4));
    const offset = view.getUint32(record + 8);
    const length = view.getUint32(record + 12);
    // A copy, not a view: Node's Buffer.slice() shares memory, and tables are edited later.
    tables.set(tag, new Uint8Array(font.subarray(offset, offset + length)));
  }
  return { version, tables };
}

export function writeSfnt({ version, tables }: Sfnt): Uint8Array {
  const tags = [...tables.keys()].sort();
  const count = tags.length;
  const entrySelector = Math.floor(Math.log2(count));
  const searchRange = 2 ** entrySelector * 16;
  const headerLength = 12 + count * 16;
  const padded = (length: number) => (length + 3) & ~3;
  const total = headerLength + tags.reduce((sum, tag) => sum + padded(tables.get(tag)?.byteLength ?? 0), 0);

  const font = new Uint8Array(total);
  const view = new DataView(font.buffer);
  view.setUint32(0, version);
  view.setUint16(4, count);
  view.setUint16(6, searchRange);
  view.setUint16(8, entrySelector);
  view.setUint16(10, count * 16 - searchRange);

  let offset = headerLength;
  let headOffset = -1;
  tags.forEach((tag, index) => {
    const data = tag === 'head' ? zeroChecksumAdjustment(tables.get(tag)) : (tables.get(tag) ?? new Uint8Array());
    const record = 12 + index * 16;
    for (let char = 0; char < 4; char++) font[record + char] = tag.charCodeAt(char);
    view.setUint32(record + 4, checksum(data));
    view.setUint32(record + 8, offset);
    view.setUint32(record + 12, data.byteLength);
    font.set(data, offset);
    if (tag === 'head') headOffset = offset;
    offset += padded(data.byteLength);
  });

  if (headOffset === -1) throw new Error('font has no head table');
  view.setUint32(headOffset + 8, (0xb1b0afba - checksum(font)) >>> 0);
  return font;
}

/** Sum of the table as big-endian uint32 words, zero-padded to a multiple of 4. */
export function checksum(data: Uint8Array): number {
  const padded = new Uint8Array((data.byteLength + 3) & ~3);
  padded.set(data);
  const view = new DataView(padded.buffer);
  let sum = 0;
  for (let offset = 0; offset < padded.byteLength; offset += 4) sum = (sum + view.getUint32(offset)) >>> 0;
  return sum;
}

function zeroChecksumAdjustment(head: Uint8Array | undefined): Uint8Array {
  if (head === undefined || head.byteLength < 12) throw new Error('invalid head table');
  const copy = new Uint8Array(head);
  new DataView(copy.buffer, copy.byteOffset, copy.byteLength).setUint32(8, 0);
  return copy;
}

/** Records of a format 0 or 1 `name` table (language-tag records of format 1 are not supported). */
export function readNames(name: Uint8Array): readonly NameRecord[] {
  const view = new DataView(name.buffer, name.byteOffset, name.byteLength);
  const format = view.getUint16(0);
  if (format !== 0 && format !== 1) throw new Error(`unsupported name table format ${format}`);
  const count = view.getUint16(2);
  const storage = view.getUint16(4);
  const records: NameRecord[] = [];
  for (let index = 0; index < count; index++) {
    const record = 6 + index * 12;
    const platformId = view.getUint16(record);
    const encodingId = view.getUint16(record + 2);
    const bytes = name.subarray(
      storage + view.getUint16(record + 10),
      storage + view.getUint16(record + 10) + view.getUint16(record + 8),
    );
    records.push({
      platformId,
      encodingId,
      languageId: view.getUint16(record + 4),
      nameId: view.getUint16(record + 6),
      text: decode(platformId, bytes),
    });
  }
  return records;
}

/** A format 0 `name` table with the records sorted as the spec requires. */
export function writeNames(records: readonly NameRecord[]): Uint8Array {
  const sorted = [...records].sort(
    (a, b) =>
      a.platformId - b.platformId || a.encodingId - b.encodingId || a.languageId - b.languageId || a.nameId - b.nameId,
  );
  const encoded = sorted.map((record) => encode(record.platformId, record.text));
  const storage = 6 + sorted.length * 12;
  const table = new Uint8Array(storage + encoded.reduce((sum, bytes) => sum + bytes.byteLength, 0));
  const view = new DataView(table.buffer);
  view.setUint16(0, 0);
  view.setUint16(2, sorted.length);
  view.setUint16(4, storage);
  let offset = 0;
  sorted.forEach((record, index) => {
    const bytes = encoded[index] ?? new Uint8Array();
    const position = 6 + index * 12;
    view.setUint16(position, record.platformId);
    view.setUint16(position + 2, record.encodingId);
    view.setUint16(position + 4, record.languageId);
    view.setUint16(position + 6, record.nameId);
    view.setUint16(position + 8, bytes.byteLength);
    view.setUint16(position + 10, offset);
    table.set(bytes, storage + offset);
    offset += bytes.byteLength;
  });
  return table;
}

/** Platform 0 (Unicode) and 3 (Windows) store UTF-16BE; platform 1 (Macintosh) stores single bytes. */
function decode(platformId: number, bytes: Uint8Array): string {
  if (platformId === 1) return String.fromCharCode(...bytes);
  let text = '';
  for (let index = 0; index + 1 < bytes.byteLength; index += 2) {
    text += String.fromCharCode(((bytes[index] ?? 0) << 8) | (bytes[index + 1] ?? 0));
  }
  return text;
}

function encode(platformId: number, text: string): Uint8Array {
  if (platformId === 1) {
    // decode() maps each byte to one char, so unchanged records round-trip byte for byte.
    if (/[\u0100-\uffff]/.test(text)) {
      throw new Error(`name "${text}" does not fit a Macintosh single-byte record`);
    }
    return Uint8Array.from(text, (char) => char.charCodeAt(0));
  }
  const bytes = new Uint8Array(text.length * 2);
  for (let index = 0; index < text.length; index++) {
    const unit = text.charCodeAt(index);
    bytes[index * 2] = unit >> 8;
    bytes[index * 2 + 1] = unit & 0xff;
  }
  return bytes;
}

/** Code point → glyph ID, from the format 12 subtable when there is one, else format 4. */
export function readCmap(cmap: Uint8Array): Map<number, number> {
  const view = new DataView(cmap.buffer, cmap.byteOffset, cmap.byteLength);
  const count = view.getUint16(2);
  const offsets = new Map<number, number>();
  for (let index = 0; index < count; index++) {
    const offset = view.getUint32(4 + index * 8 + 4);
    offsets.set(view.getUint16(offset), offset);
  }
  const mapping = new Map<number, number>();
  const format12 = offsets.get(12);
  const format4 = offsets.get(4);
  if (format12 !== undefined) {
    const groups = view.getUint32(format12 + 12);
    for (let group = 0; group < groups; group++) {
      const record = format12 + 16 + group * 12;
      const first = view.getUint32(record);
      const last = view.getUint32(record + 4);
      const glyph = view.getUint32(record + 8);
      for (let codePoint = first; codePoint <= last; codePoint++) mapping.set(codePoint, glyph + codePoint - first);
    }
  } else if (format4 !== undefined) {
    const segments = view.getUint16(format4 + 6) / 2;
    const ends = format4 + 14;
    const starts = ends + segments * 2 + 2;
    const deltas = starts + segments * 2;
    const rangeOffsets = deltas + segments * 2;
    for (let segment = 0; segment < segments; segment++) {
      const end = view.getUint16(ends + segment * 2);
      const start = view.getUint16(starts + segment * 2);
      const delta = view.getInt16(deltas + segment * 2);
      const rangeOffset = view.getUint16(rangeOffsets + segment * 2);
      for (let codePoint = start; codePoint <= end && codePoint !== 0xffff; codePoint++) {
        let glyph: number;
        if (rangeOffset === 0) {
          glyph = (codePoint + delta) & 0xffff;
        } else {
          const at = rangeOffsets + segment * 2 + rangeOffset + (codePoint - start) * 2;
          const raw = view.getUint16(at);
          glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
        }
        if (glyph !== 0) mapping.set(codePoint, glyph);
      }
    }
  } else {
    throw new Error('cmap has neither a format 4 nor a format 12 subtable');
  }
  return mapping;
}

/**
 * A cmap with a format 4 subtable for platforms 0/3 and 3/1, plus format 12 for 0/4 and 3/10 when a code point is
 * outside the BMP.
 */
export function writeCmap(mapping: ReadonlyMap<number, number>): Uint8Array {
  const codePoints = [...mapping.keys()].sort((a, b) => a - b);
  const bmp = codePoints.filter((codePoint) => codePoint < 0xffff);
  const subtable4 = format4(bmp, mapping);
  const needs12 = codePoints.some((codePoint) => codePoint > 0xffff);
  const subtable12 = needs12 ? format12(codePoints, mapping) : undefined;
  type Encoding = readonly [platform: number, encoding: number, table: Uint8Array];
  const records: readonly Encoding[] = [
    [0, 3, subtable4],
    ...(subtable12 === undefined ? [] : [[0, 4, subtable12] satisfies Encoding]),
    [3, 1, subtable4],
    ...(subtable12 === undefined ? [] : [[3, 10, subtable12] satisfies Encoding]),
  ];
  const headerLength = 4 + records.length * 8;
  const unique = [...new Set(records.map(([, , table]) => table))];
  const offsets = new Map<Uint8Array, number>();
  let offset = headerLength;
  for (const table of unique) {
    offsets.set(table, offset);
    offset += table.byteLength;
  }
  const cmap = new Uint8Array(offset);
  const view = new DataView(cmap.buffer);
  view.setUint16(0, 0);
  view.setUint16(2, records.length);
  records.forEach(([platform, encoding, table], index) => {
    view.setUint16(4 + index * 8, platform);
    view.setUint16(4 + index * 8 + 2, encoding);
    view.setUint32(4 + index * 8 + 4, offsets.get(table) ?? 0);
  });
  for (const table of unique) cmap.set(table, offsets.get(table) ?? 0);
  return cmap;
}

/** Segments of consecutive code points with a constant glyph delta, each encoded with idDelta. */
function format4(codePoints: readonly number[], mapping: ReadonlyMap<number, number>): Uint8Array {
  const segments: [start: number, end: number, delta: number][] = [];
  for (const codePoint of codePoints) {
    const delta = (mapping.get(codePoint) ?? 0) - codePoint;
    const last = segments.at(-1);
    if (last !== undefined && last[1] === codePoint - 1 && last[2] === delta) last[1] = codePoint;
    else segments.push([codePoint, codePoint, delta]);
  }
  segments.push([0xffff, 0xffff, 1]);
  const count = segments.length;
  const length = 16 + count * 8;
  const table = new Uint8Array(length);
  const view = new DataView(table.buffer);
  const entrySelector = Math.floor(Math.log2(count));
  const searchRange = 2 ** entrySelector * 2;
  view.setUint16(0, 4);
  view.setUint16(2, length);
  view.setUint16(4, 0);
  view.setUint16(6, count * 2);
  view.setUint16(8, searchRange);
  view.setUint16(10, entrySelector);
  view.setUint16(12, count * 2 - searchRange);
  segments.forEach(([start, end, delta], index) => {
    view.setUint16(14 + index * 2, end);
    view.setUint16(16 + count * 2 + index * 2, start);
    view.setUint16(16 + count * 4 + index * 2, delta & 0xffff);
    view.setUint16(16 + count * 6 + index * 2, 0);
  });
  return table;
}

function format12(codePoints: readonly number[], mapping: ReadonlyMap<number, number>): Uint8Array {
  const groups: [first: number, last: number, glyph: number][] = [];
  for (const codePoint of codePoints) {
    const glyph = mapping.get(codePoint) ?? 0;
    const last = groups.at(-1);
    if (last !== undefined && last[1] === codePoint - 1 && last[2] + codePoint - last[0] === glyph) last[1] = codePoint;
    else groups.push([codePoint, codePoint, glyph]);
  }
  const table = new Uint8Array(16 + groups.length * 12);
  const view = new DataView(table.buffer);
  view.setUint16(0, 12);
  view.setUint32(4, table.byteLength);
  view.setUint32(12, groups.length);
  groups.forEach(([first, last, glyph], index) => {
    view.setUint32(16 + index * 12, first);
    view.setUint32(16 + index * 12 + 4, last);
    view.setUint32(16 + index * 12 + 8, glyph);
  });
  return table;
}
