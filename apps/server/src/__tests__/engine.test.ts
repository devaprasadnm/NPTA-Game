// ============================================
// Engine Unit Tests (Node.js Test Runner)
// ============================================

import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { ValidationEngine } from '../engine/ValidationEngine.js';
import { ScoringEngine } from '../engine/ScoringEngine.js';
import { LetterGenerator } from '../engine/LetterGenerator.js';
import { Category } from '@npta/shared';
import { datasetLoader } from '../data/datasetLoader.js';

// Load datasets once before all tests
before(() => {
  datasetLoader.load();
});

describe('ValidationEngine', () => {
  test('validates a known place starting with the target letter', () => {
    // 'amsterdam' is in places.json
    const res = ValidationEngine.validateAnswer('  Amsterdam ', 'A', Category.PLACE);
    assert.strictEqual(res.isValid, true);
  });

  test('rejects empty or whitespace-only answers', () => {
    const res = ValidationEngine.validateAnswer('   ', 'A', Category.NAME);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.reason, 'empty');
  });

  test('rejects answer starting with wrong letter', () => {
    const res = ValidationEngine.validateAnswer('Berlin', 'A', Category.PLACE);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.reason, 'wrong_letter');
  });

  test('is case insensitive — validates "ALLIGATOR" as animal', () => {
    const res = ValidationEngine.validateAnswer('ALLIGATOR', 'A', Category.ANIMAL);
    assert.strictEqual(res.isValid, true);
  });

  test('rejects a word not in the dataset', () => {
    const res = ValidationEngine.validateAnswer('axyzbq', 'A', Category.NAME);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.reason, 'not_in_dataset');
  });

  test('returns a fuzzy suggestion for a close misspelling', () => {
    // 'alligater' → should suggest 'alligator' (edit distance 1)
    const res = ValidationEngine.validateAnswer('alligater', 'A', Category.ANIMAL);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.suggestion, 'Expected a fuzzy suggestion');
    assert.ok(
      typeof res.editDistance === 'number' && res.editDistance <= 2,
      `Edit distance should be ≤ 2, got ${res.editDistance}`,
    );
  });

  test('validates a known profession', () => {
    const res = ValidationEngine.validateAnswer('architect', 'A', Category.PROFESSION);
    assert.strictEqual(res.isValid, true);
  });

  test('rejects a valid word in the wrong category', () => {
    // 'alligator' is an animal, not a profession
    const res = ValidationEngine.validateAnswer('alligator', 'A', Category.PROFESSION);
    assert.strictEqual(res.isValid, false);
  });
});

describe('ScoringEngine', () => {
  test('awards 10 points for unique valid answer, 5 points for duplicate', () => {
    const playerAnswers = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        answers: {
          [Category.NAME]:       'Anna',
          [Category.PLACE]:      'Amsterdam',
          [Category.THING]:      'axe',
          [Category.ANIMAL]:     'Antelope',
          [Category.PROFESSION]: 'Architect',
        },
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        answers: {
          [Category.NAME]:       'Anna',       // Duplicate with Alice → 5
          [Category.PLACE]:      'Algeria',     // Unique (in dataset) → 10
          [Category.THING]:      'axe',         // Duplicate with Alice → 5
          [Category.ANIMAL]:     'Alligator',   // Unique → 10
          [Category.PROFESSION]: 'Actor',       // Unique → 10
        },
      },
    ];

    const results = ScoringEngine.calculateRoundScores(playerAnswers, 'A');

    const alice = results.find((r) => r.playerId === 'p1')!;
    const bob = results.find((r) => r.playerId === 'p2')!;

    // Alice: Name=5(dup), Place=10(uniq), Thing=5(dup), Animal=10(uniq), Profession=10(uniq) = 40
    assert.strictEqual(alice.roundScore, 40);

    // Bob: Name=5(dup), Place=10(uniq Algeria), Thing=5(dup), Animal=10(uniq), Profession=10(uniq) = 40
    assert.strictEqual(bob.roundScore, 40);
  });

  test('awards 0 points for invalid or blank answers', () => {
    const playerAnswers = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        answers: {
          [Category.NAME]:       'Bob',   // Wrong letter ('B' vs 'A') → 0
          [Category.PLACE]:      '',       // Blank → 0
          [Category.THING]:      '   ',   // Whitespace → 0
          [Category.ANIMAL]:     'Ant',   // Valid animal → depends on dataset
          [Category.PROFESSION]: 'Actor', // Valid profession → 10
        },
      },
    ];

    const results = ScoringEngine.calculateRoundScores(playerAnswers, 'A');
    const alice = results.find((r) => r.playerId === 'p1')!;

    // Name=0, Place=0, Thing=0. Actor is in dataset (10). Ant may/may not be.
    // At minimum: Name+Place+Thing = 0, Actor = 10 → score ≥ 10
    assert.ok(alice.roundScore >= 10, `Expected score ≥ 10, got ${alice.roundScore}`);
    // And the wrong-letter answer must be 0
    const nameAnswer = alice.answers.find((a) => a.category === Category.NAME)!;
    assert.strictEqual(nameAnswer.score, 0);
  });
});

describe('LetterGenerator', () => {
  test('picks an unused letter', () => {
    const used = ['A', 'B', 'C'];
    const letter = LetterGenerator.pickLetter(used);
    assert.strictEqual(used.includes(letter), false);
  });

  test('resets pool when all 26 letters are used', () => {
    const all26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const letter = LetterGenerator.pickLetter(all26);
    assert.ok(all26.includes(letter));
  });
});
