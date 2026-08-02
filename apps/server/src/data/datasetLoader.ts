// ============================================
// Dataset Loader — Loads word lists into memory at startup
// Uses JavaScript Sets for O(1) lookups
// ============================================

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Category } from '@npta/shared';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** The path to the data directory (relative to this file) */
const DATA_DIR = join(__dirname, '../data');

/** Map of category → Set of valid (normalised) words */
type DatasetMap = Map<Category, Set<string>>;

/**
 * Normalise a word for consistent Set storage and lookup:
 * - Lowercase
 * - Trim surrounding whitespace
 * - Collapse internal runs of whitespace to a single space
 * - Remove leading/trailing punctuation that isn't part of the word
 */
function normaliseWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
}

class DatasetLoader {
  private datasets: DatasetMap = new Map();
  private loaded = false;

  /**
   * Load all category datasets from JSON files into memory.
   * Called once synchronously at server startup — blocking is intentional
   * so that validation is ready before the first request is accepted.
   */
  load(): void {
    if (this.loaded) return;

    const filePaths: Record<Category, string> = {
      [Category.NAME]:       join(DATA_DIR, 'names.json'),
      [Category.PLACE]:      join(DATA_DIR, 'places.json'),
      [Category.ANIMAL]:     join(DATA_DIR, 'animals.json'),
      [Category.PROFESSION]: join(DATA_DIR, 'professions.json'),
      [Category.THING]:      join(DATA_DIR, 'things.json'),
    };

    for (const [category, filePath] of Object.entries(filePaths) as [Category, string][]) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const words: unknown = JSON.parse(raw);

        if (!Array.isArray(words)) {
          throw new Error(`Expected an array in ${filePath}`);
        }

        const wordSet = new Set<string>();
        for (const w of words) {
          if (typeof w === 'string' && w.length > 0) {
            wordSet.add(normaliseWord(w));
          }
        }

        this.datasets.set(category, wordSet);

        logger.info(
          'DatasetLoader',
          `Loaded category "${category}": ${wordSet.size} words`,
        );
      } catch (err) {
        logger.error(
          'DatasetLoader',
          `Failed to load dataset for category "${category}" from ${filePath}`,
          err,
        );
        // Fail fast — we cannot run without datasets
        throw err;
      }
    }

    this.loaded = true;
    const total = [...this.datasets.values()].reduce((sum, s) => sum + s.size, 0);
    logger.info('DatasetLoader', `All datasets loaded. Total words in memory: ${total}`);
  }

  /**
   * Get the Set for a given category.
   * Returns an empty Set if the category hasn't been loaded (should not happen).
   */
  getDataset(category: Category): Set<string> {
    return this.datasets.get(category) ?? new Set<string>();
  }

  /**
   * Check whether datasets have been loaded.
   */
  isLoaded(): boolean {
    return this.loaded;
  }
}

/** Singleton — import this everywhere */
export const datasetLoader = new DatasetLoader();
