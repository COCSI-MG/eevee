# JavaScript Default Worker

JavaScript-only Node.js worker used by the `javascript_default` worker type.

Student source files, generated template variables, and teacher tests use ES
Modules and the `.js` extension. Jest transforms ES Modules with Babel while
the image intentionally omits TypeScript, `ts-node`, and `ts-jest`.

## Local smoke test

```bash
npm install
npm test
```

## Build the image

From `images/`:

```bash
make build-javascript-default
```
