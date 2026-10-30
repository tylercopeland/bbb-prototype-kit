import { describe, expect, it } from 'vitest';
import { firstName, firstNameWithInitial, nameWords } from './names';

describe('names', () => {
  it('drops honorifics and a trailing generational suffix', () => {
    expect(nameWords('Prof. Helena Costa')).toEqual(['Helena', 'Costa']);
    expect(nameWords('Dra. Marta Ribeiro')).toEqual(['Marta', 'Ribeiro']);
    expect(nameWords('Frederick Alexander Dixon-Whitworth III')).toEqual([
      'Frederick',
      'Alexander',
      'Dixon-Whitworth',
    ]);
    expect(nameWords('Martin Luther King Jr.')).toEqual(['Martin', 'Luther', 'King']);
    // A suffix alone is still a name.
    expect(nameWords('V')).toEqual(['V']);
    expect(nameWords('  Dr.  ')).toEqual([]);
  });

  it('gives the first name and the first name with the last initial', () => {
    expect(firstName('Prof. Helena Costa')).toBe('Helena');
    expect(firstName('Bruno')).toBe('Bruno');
    expect(firstName('Dr.')).toBe('Dr.');
    expect(firstNameWithInitial('Ana Souza')).toBe('Ana S.');
    expect(firstNameWithInitial('Frederick Dixon III')).toBe('Frederick D.');
    expect(firstNameWithInitial('Bruno')).toBe('Bruno');
    expect(firstNameWithInitial('Dr.')).toBe('Dr.');
  });
});
