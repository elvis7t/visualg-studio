export class BreakSignal extends Error {
  constructor() {
    super('interrompa');
    this.name = 'BreakSignal';
  }
}

export class ReturnSignal extends Error {
  constructor(value) {
    super('retorne');
    this.name = 'ReturnSignal';
    this.value = value;
  }
}
