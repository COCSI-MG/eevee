import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadPyodide } from 'pyodide';
const lock = JSON.parse(await readFile(new URL('../python-assets.lock.json', import.meta.url), 'utf8'));
const python = await loadPyodide();
for (const name of ['parso', 'jedi', 'pandas-stubs']) {
 const file = lock.packages[name].file;
 python.unpackArchive(new Uint8Array(await readFile(new URL(`../public/pyodide/${lock.pyodideVersion}/${file}`, import.meta.url))), 'zip', { extractDir:'/home/pyodide' });
}
python.runPython("import os; os.rename('/home/pyodide/pandas-stubs','/home/pyodide/pandas')");
python.runPython(await readFile(new URL('../src/lib/monaco/python/semantic.py',import.meta.url),'utf8'));
const query = (code,line,column,kind) => {
 for (const [key,value] of Object.entries({code,line,column,kind})) python.globals.set(key,value);
 return JSON.parse(python.runPython('semantic_query(code,line,column,kind)'));
};
const code='import pandas as pd\ndf = pd.read_csv("data.csv")\ndf.';
const methods=query(code,3,3,'complete');
for (const name of ['head','groupby','merge','dropna']) assert(methods.some(x=>x.label===name),name);
const typed='import pandas as pd\ndf: pd.DataFrame\ndf.';
assert(query(typed,3,3,'complete').some(x=>x.label==='head'));
const hover=query('import pandas as pd\ndf: pd.DataFrame\ndf',3,2,'hover');
assert(hover.some(x=>x.detail.includes('DataFrame')),JSON.stringify(hover));
const signatures=query('import pandas as pd\ndf: pd.DataFrame\ndf.head(',3,8,'signature');
assert(signatures.some(x=>x.label.includes('head') && x.parameters.some(p=>p.includes('n'))),JSON.stringify(signatures));
query('raise RuntimeError("must not execute")\nvalue = []\nvalue.',3,6,'complete');
console.log('PASS: DataFrame read_csv completions, annotated DataFrame, hover, method signatures, no student execution');
console.log(JSON.stringify({methodCount:methods.length,hover,signatures}));
