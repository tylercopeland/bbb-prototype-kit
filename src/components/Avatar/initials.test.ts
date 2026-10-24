import { describe, expect, it } from 'vitest';
import { INITIALS_FALLBACK, initials } from './initials';

describe('initials', () => {
  it('takes the first letter of the first and last word', () => {
    expect(initials('Rafaela Monaco')).toBe('RM');
    expect(initials('Helena Maria Costa')).toBe('HC');
  });

  it('takes the first two letters of a single word', () => {
    expect(initials('Bruno')).toBe('BR');
    expect(initials('Ana')).toBe('AN');
  });

  it('strips English and Portuguese honorifics', () => {
    expect(initials('Prof. Ana Souza')).toBe('AS');
    expect(initials('Profa. Ana Souza')).toBe('AS');
    expect(initials('Dr Lucas Pereira')).toBe('LP');
    expect(initials('Dra. Marta Ribeiro')).toBe('MR');
    expect(initials('Ms. Ellen')).toBe('EL');
    expect(initials('Mr. Timo')).toBe('TI');
    expect(initials('Mrs. Marta Ribeiro')).toBe('MR');
    expect(initials('Sr. Octavio')).toBe('OC');
    expect(initials('Sra. Joana Lima')).toBe('JL');
  });

  it('strips a trailing "(you)"', () => {
    expect(initials('Helena Costa (you)')).toBe('HC');
    expect(initials('Bruno (you)')).toBe('BR');
  });

  it('handles accented names by grapheme, after NFC normalization', () => {
    expect(initials('Édouard Łukasz')).toBe('ÉŁ');
    expect(initials('ólafur')).toBe('ÓL');
    expect(initials('Ægir')).toBe('ÆG');
    // "É" as E plus a combining acute accent is one grapheme.
    expect(initials('Élodie Martin')).toBe('ÉM');
    expect(initials('🦊 Fox')).toBe('🦊F');
  });

  it('takes the first grapheme only for CJK names', () => {
    expect(initials('李小龙')).toBe('李');
    expect(initials('山田 太郎')).toBe('山');
    expect(initials('김민준')).toBe('김');
  });

  it('falls back to a placeholder when nothing is left', () => {
    expect(INITIALS_FALLBACK).toBe('?');
    expect(initials('')).toBe('?');
    expect(initials('Dr.')).toBe('?');
    expect(initials('  Joana   Lima ')).toBe('JL');
  });
});
