import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it('takes the first letter of the first and last word', () => {
    expect(initials('Rafaela Monaco')).toBe('RM');
    expect(initials('Helena Maria Costa')).toBe('HC');
  });

  it('takes the first two letters of a single word', () => {
    expect(initials('Bruno')).toBe('BR');
    expect(initials('Ana')).toBe('AN');
  });

  it('strips honorifics', () => {
    expect(initials('Prof. Ana Souza')).toBe('AS');
    expect(initials('Dr Lucas Pereira')).toBe('LP');
    expect(initials('Ms. Ellen')).toBe('EL');
    expect(initials('Mr. Timo')).toBe('TI');
    expect(initials('Mrs. Marta Ribeiro')).toBe('MR');
  });

  it('strips a trailing "(you)"', () => {
    expect(initials('Helena Costa (you)')).toBe('HC');
    expect(initials('Bruno (you)')).toBe('BR');
  });

  it('handles accented and non-Latin names by code point', () => {
    expect(initials('Édouard Łukasz')).toBe('ÉŁ');
    expect(initials('ólafur')).toBe('ÓL');
    expect(initials('李小龙')).toBe('李小');
    expect(initials('Ægir')).toBe('ÆG');
  });

  it('survives extra whitespace and empty input', () => {
    expect(initials('  Joana   Lima ')).toBe('JL');
    expect(initials('')).toBe('');
    expect(initials('Dr.')).toBe('');
  });
});
