import { stableStringify, computeRecordHash } from '../utils/hashing';

describe('hashing utilities', () => {
  describe('stableStringify', () => {
    it('should produce deterministic output for objects', () => {
      const obj1 = { b: 2, a: 1, c: 3 };
      const obj2 = { a: 1, c: 3, b: 2 };
      expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3];
      expect(stableStringify(arr)).toBe('[1,2,3]');
    });

    it('should handle nested structures', () => {
      const obj = { photos: [{ id: 'b', sort: 2 }, { id: 'a', sort: 1 }] };
      const result = stableStringify(obj);
      expect(result).toContain('"id":"a"');
      expect(result).toContain('"id":"b"');
    });
  });

  describe('computeRecordHash', () => {
    it('should produce same hash for same input', async () => {
      const photos = [
        { id: '1', mimeType: 'image/jpeg', sha256: 'abc', sortIndex: 0 },
      ];
      const hash1 = await computeRecordHash('2024-01-01', 1000, 'note', photos);
      const hash2 = await computeRecordHash('2024-01-01', 1000, 'note', photos);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', async () => {
      const photos = [
        { id: '1', mimeType: 'image/jpeg', sha256: 'abc', sortIndex: 0 },
      ];
      const hash1 = await computeRecordHash('2024-01-01', 1000, 'note', photos);
      const hash2 = await computeRecordHash('2024-01-02', 1000, 'note', photos);
      expect(hash1).not.toBe(hash2);
    });

    it('should sort photos by sortIndex then id', async () => {
      const photos = [
        { id: 'b', mimeType: 'image/jpeg', sha256: 'abc', sortIndex: 1 },
        { id: 'a', mimeType: 'image/jpeg', sha256: 'def', sortIndex: 0 },
      ];
      const photosReversed = [
        { id: 'a', mimeType: 'image/jpeg', sha256: 'def', sortIndex: 0 },
        { id: 'b', mimeType: 'image/jpeg', sha256: 'abc', sortIndex: 1 },
      ];
      const hash1 = await computeRecordHash('2024-01-01', 1000, 'note', photos);
      const hash2 = await computeRecordHash('2024-01-01', 1000, 'note', photosReversed);
      expect(hash1).toBe(hash2);
    });
  });
});
