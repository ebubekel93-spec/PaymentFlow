'use strict';

const { toStroops, fromStroops } = require('./stellarAmount');

class Stroops {
  constructor(value) {
    if (typeof value !== 'bigint') throw new TypeError('Stroops requires a BigInt');
    this.value = value;
    Object.freeze(this);
  }

  static fromXLM(amount) {
    return new Stroops(toStroops(amount));
  }

  static fromPayment(payment) {
    return payment.amountStroops == null
      ? Stroops.fromXLM(payment.amount)
      : new Stroops(BigInt(payment.amountStroops));
  }

  add(other) {
    return new Stroops(this.value + other.value);
  }

  subtract(other) {
    return new Stroops(this.value - other.value);
  }

  compare(other) {
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }

  toXLM() {
    return fromStroops(this.value);
  }

  toNumber() {
    return Number(this.toXLM());
  }

  toAmountFields() {
    // Preserve full signed 64-bit precision over JSON.
    const integer = Number(this.value);
    return {
      amountStroops: Number.isSafeInteger(integer) ? integer : this.value.toString(),
      amountXLM: this.toXLM(),
    };
  }
}

// Prefer the exact stored integer and derive a decimal for older payments.
const paymentAmountDecimal = {
  $ifNull: [
    { $divide: [{ $toDecimal: '$amountStroops' }, 10000000] },
    { $toDecimal: '$amount' },
  ],
};

module.exports = { Stroops, paymentAmountDecimal };
