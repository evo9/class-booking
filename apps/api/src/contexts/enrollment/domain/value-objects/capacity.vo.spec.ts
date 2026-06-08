import { Capacity } from './capacity.vo';

describe('Capacity', () => {
  it('creates with a positive integer', () => {
    const cap = new Capacity(10);
    expect(cap.value).toBe(10);
  });

  it('creates with value 1 (minimum)', () => {
    const cap = new Capacity(1);
    expect(cap.value).toBe(1);
  });

  it('throws on zero', () => {
    expect(() => new Capacity(0)).toThrow();
  });

  it('throws on negative value', () => {
    expect(() => new Capacity(-5)).toThrow();
  });

  it('throws on non-integer (float)', () => {
    expect(() => new Capacity(2.5)).toThrow();
  });

  it('exposes value as own property', () => {
    const cap = new Capacity(5);
    expect(cap.value).toBe(5);
    expect(Object.prototype.hasOwnProperty.call(cap, 'value')).toBe(true);
  });
});
