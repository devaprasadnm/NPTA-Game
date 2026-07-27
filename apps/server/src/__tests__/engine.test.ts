// ============================================
// Engine Unit Tests (Node.js Test Runner)
// ============================================

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ValidationEngine } from '../engine/ValidationEngine.js';
import { ScoringEngine } from '../engine/ScoringEngine.js';
import { LetterGenerator } from '../engine/LetterGenerator.js';
import { Category } from '@npta/shared';

describe('ValidationEngine', () => {
  test('validates correct answer starting with target letter', () => {
    const res = ValidationEngine.validateAnswer('  Amsterdam ', 'A');
    assert.strictEqual(res.isValid, true);
  });

  test('rejects empty or whitespace-only answers', () => {
    const res = ValidationEngine.validateAnswer('   ', 'A');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.reason, 'empty');
  });

  test('rejects answer starting with wrong letter', () => {
    const res = ValidationEngine.validateAnswer('Berlin', 'A');
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.reason, 'must start with "A"');
  });

  test('is case insensitive', () => {
    const res = ValidationEngine.validateAnswer('apple', 'A');
    assert.strictEqual(res.isValid, true);
  });
});

describe('ScoringEngine', () => {
  test('awards 10 points for unique valid answer, 5 points for duplicate', () => {
    const playerAnswers = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        answers: {
          [Category.NAME]: 'Anna',
          [Category.PLACE]: 'Amsterdam',
          [Category.THING]: 'Apple',
          [Category.ANIMAL]: 'Antelope',
          [Category.PROFESSION]: 'Architect',
        },
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        answers: {
          [Category.NAME]: 'Anna', // Duplicate with Alice
          [Category.PLACE]: 'Athens', // Unique
          [Category.THING]: 'Apple', // Duplicate with Alice
          [Category.ANIMAL]: 'Alligator', // Unique
          [Category.PROFESSION]: 'Actor', // Unique
        },
      },
    ];

    const results = ScoringEngine.calculateRoundScores(playerAnswers, 'A');

    const alice = results.find((r) => r.playerId === 'p1')!;
    const bob = results.find((r) => r.playerId === 'p2')!;

    // Alice: Name=5 (dup), Place=10 (uniq), Thing=5 (dup), Animal=10 (uniq), Profession=10 (uniq) = 40
    assert.strictEqual(alice.roundScore, 40);

    // Bob: Name=5 (dup), Place=10 (uniq), Thing=5 (dup), Animal=10 (uniq), Profession=10 (uniq) = 40
    assert.strictEqual(bob.roundScore, 40);
  });

  test('awards 0 points for invalid or blank answers', () => {
    const playerAnswers = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        answers: {
          [Category.NAME]: 'Bob', // Wrong letter ('B' vs 'A')
          [Category.PLACE]: '', // Blank
          [Category.THING]: '   ', // Whitespace
          [Category.ANIMAL]: 'Ant',
          [Category.PROFESSION]: 'Artist',
        },
      },
    ];

    const results = ScoringEngine.calculateRoundScores(playerAnswers, 'A');
    const alice = results.find((r) => r.playerId === 'p1')!;

    // Name=0, Place=0, Thing=0, Animal=10, Profession=10 = 20
    assert.strictEqual(alice.roundScore, 20);
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
