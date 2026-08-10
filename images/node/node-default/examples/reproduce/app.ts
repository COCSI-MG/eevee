// Deterministic reproduction example for `make reproduce-node-default`.
// Returns the four basic arithmetic operations over two numbers.
export function main(a: number, b: number): number[] {
  return [a + b, a - b, a * b, a / b];
}
