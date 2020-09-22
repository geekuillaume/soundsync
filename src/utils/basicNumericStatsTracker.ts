const mean = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;

export class NumericStatsTracker<T> {
  private buffer: T[] = [];

  constructor(
    public defaultGetter: (val: T) => number,
    private maxAge: number,
  ) {}

  push(point: T) {
    this.buffer.unshift(point);
    if (this.buffer.length > this.maxAge) {
      this.buffer.splice(this.maxAge);
    }
  }

  mean(age = this.maxAge, getter = this.defaultGetter, filter?: (point: T) => boolean) {
    if (age > this.maxAge) {
      throw new Error('Asked age is greater than maxAge');
    }
    const buffer = this.buffer.filter(filter || (() => true)).slice(0, age);
    return mean(buffer.map(getter));
  }

  meanInStandardDeviation({ age = this.maxAge, getter = this.defaultGetter, deviationGetter = this.defaultGetter } = {}) {
    const stdDev = this.standardDeviation(age, deviationGetter);
    return this.mean(age, getter, (v) => Math.abs(deviationGetter(v) - stdDev.mean) <= stdDev.standardDeviation);
  }

  median(age = this.maxAge, getter = this.defaultGetter, filter?: (point: T) => boolean) {
    if (age > this.maxAge) {
      throw new Error('Asked age is greater than maxAge');
    }
    const buffer = this.buffer.filter(filter || (() => true)).map(getter).slice(0, age).sort();
    if (buffer.length % 2 === 1) {
      return (buffer[Math.floor(buffer.length / 2)] + buffer[Math.ceil(buffer.length / 2)]) / 2;
    }
    return buffer[buffer.length / 2];
  }

  standardDeviation(age = this.maxAge, getter = this.defaultGetter) {
    const meanValue = this.mean(age, getter);
    return {
      mean: meanValue,
      standardDeviation: Math.sqrt(mean(this.buffer.map(getter).map((val) => (meanValue - val) ** 2))),
    };
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
