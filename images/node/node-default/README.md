# Default Node Worker

Application that runs on the default node worker

## The application should:

- Import the functions from app.ts
- Run the tests from validation.test.ts
- Print the results of the tests
- Print the time it took to run the tests
- Finish the process

## Running the application

You first need to input both of those files in the home directory:

- app.ts
- validation.test.ts

Then you can run the application with the following command:

```bash
npm start
```

## Expected output

The output should be similar to the following:

```bash
npm start

> cefetcodelab-node-default@1.0.0 start
> ts-node ./trigger.ts

Checking dependencies...
Dependencies checked!
Running tests...
app.ts exists.
validation.test.ts exists.
stdout:
> cefetcodelab-node-default@1.0.0 test
> jest


stderr: PASS ./validation.test.ts
  main
    √ should be able to sum (2 ms)
    √ should be able to subtract
    √ should be able to multiply
    √ should be able to divide

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        0.781 s, estimated 2 s
Ran all test suites.

Tests run!
```

## Errors

If anything goes wrong, the application should print an error message and finish the process.
