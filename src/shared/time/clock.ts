export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date { return new Date(); }
}

export class FixedClock implements Clock {
  constructor(private readonly value: Date) {}
  now(): Date { return new Date(this.value); }
}
