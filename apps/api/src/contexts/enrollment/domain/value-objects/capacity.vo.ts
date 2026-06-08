export class Capacity {
  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(
        `Invalid capacity: ${value}. Must be a positive integer.`,
      );
    }
  }
}
