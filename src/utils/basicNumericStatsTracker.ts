export class BasicNumericStatsTracker {
  private buffer: number[] = [];

  constructor(private maxAge: number) {}

  push(point: number) {
    this.buffer.unshift(point);
    if (this.buffer.length > this.maxAge) {
      this.buffer.splice(this.maxAge);
    }
  }

  mean(age = this.maxAge) {
    if (age > this.maxAge) {
      throw new Error('Asked age is greater than maxAge');
    }
    const buffer = this.buffer.slice(0, age);
    return buffer.reduce((a, b) => a + b, 0) / buffer.length;
  }

  median(age = this.maxAge) {
    if (age > this.maxAge) {
      throw new Error('Asked age is greater than maxAge');
    }
    const buffer = this.buffer.slice(0, age).sort();
    if (buffer.length % 2 === 1) {
      return (buffer[Math.floor(buffer.length / 2)] + buffer[Math.ceil(buffer.length / 2)]) / 2;
    }
    return buffer[buffer.length / 2];
  }

  full(age = this.maxAge) {
    if (age > this.maxAge) {
      throw new Error('Asked age is greater than maxAge');
    }
    return this.buffer.length >= age;
  }

  flush() {
    this.buffer = [];
  }
}
