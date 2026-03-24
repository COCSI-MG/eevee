function math_add(a: any, b: any) {
  return a + b;
}

function math_sub(a: number, b: number) {
  return a - b;
}

function math_mul(a: number, b: number) {
  return a * b;
}

function math_div(a: number, b: number) {
  return a / b;
}

// EXERCISE 1
// CREATE FOUR FUNCTIONS THAT PERFORM ALL BASIC
// MATHEMATICAL OPERATIONS (ADDITION, SUBTRACTION,
// MULTIPLICATION AND DIVISION) ON TWO NUMBERS SUPPLIED
// AS ARGUMENTS TO THE FUNCTION.

// RETURN THE RESULT AS AN ARRAY IN THE FOLLOWING ORDER:
// - ADDITION
// - SUBTRACTION
// - MULTIPLICATION
// - DIVISION

// PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
export function main(a: number, b: number) {
  // YOUR CODE HERE
  return [math_add(a, b), math_sub(a, b), math_mul(a, b), math_div(a, b)];
}
