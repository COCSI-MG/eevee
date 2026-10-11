import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadPyodide } from "pyodide";

// Exercise the real WASM parser/linter, not mocks or the host's Python version.
const root = new URL("../", import.meta.url);
const python = await loadPyodide();
const wheel = await readFile(new URL("public/pyodide/314.0.7/pyflakes-3.4.0-py2.py3-none-any.whl", root));
python.unpackArchive(new Uint8Array(wheel), "zip", { extractDir: "/home/pyodide" });
python.runPython(await readFile(new URL("src/lib/monaco/python/checker.py", root), "utf8"));
const check = (code) => {
  python.globals.set("student_source", code);
  try { return JSON.parse(python.runPython("check_source(student_source)")); }
  finally { python.globals.delete("student_source"); }
};

assert.deepEqual(check("def total(items):\n    return sum(x*x for x in items)\nprint(total(range(20)))"), []);
for (const code of ["def f()\n    pass", "if True\n    pass", "for x in []\n    pass"]) {
  assert.equal(check(code)[0].severity, "error");
  assert.equal(check(code)[0].line, 1);
}
assert.match(check("def f():\nprint(1)")[0].message, /indented block/);
assert.equal(check("def f():\nprint(1)")[0].line, 2);
assert.match(check("return 1")[0].message, /outside function/);
assert.match(check("print(missing_name)")[0].message, /undefined name/);
assert.match(check("import os")[0].message, /imported but unused/);
assert.equal(check('print("😀", missing_name)')[0].column, 13);
assert.deepEqual(check("raise RuntimeError('student code must not execute')"), []);
assert.deepEqual(check("class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, item):\n        self.items.append(item)\n\nstack = Stack()\nstack.push(1)"), []);
const large = Array.from({ length: 500 }, (_, i) => `value_${i} = ${i}`).join("\n") + "\nprint(missing_large)";
const started = performance.now();
assert.equal(check(large)[0].line, 501);
console.log(`500-line analysis: ${Math.round(performance.now() - started)}ms`);
python.runPython("Checker = None");
assert.equal(check("def f():\npass")[0].severity, "error");
assert.deepEqual(check("print(1)"), []);
python.runPython("def Checker(*args, **kwargs):\n    raise RuntimeError('simulated lint failure')");
assert.deepEqual(check("print(1)"), []);
assert.equal(check("if True\n    pass")[0].severity, "error");
console.log("PASS: real Pyodide syntax, lint, Unicode, large files, no execution, and lint failure isolation");
