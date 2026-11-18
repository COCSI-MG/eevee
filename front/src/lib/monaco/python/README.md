# Python editor assistance

Syntax/lint uses the existing Pyodide worker. Semantic assistance is lazy-loaded in a separate worker using Jedi 0.19.2 and pandas-stubs 3.1.0.261029, served from the application origin. Student source is parsed, never executed.

Supported checks: DataFrame member completions, inferred/annotated DataFrame hover, and method signatures in the active file. pandas-stubs aligns with pandas 3.1 in the assignment runner. Overloads such as read_csv can produce a union of DataFrame and TextFileReader suggestions.

Limitations: only the current file is sent to semantic analysis; imports from other workspace files are NOT resolved. CSV content and actual column names/dtypes are not loaded or inferred. This is not full type checking or a guarantee of runtime correctness. Browser UI validation remains pending because the Windows UI automation runtime could not start; provider unit tests and real WASM tests are separate evidence.

Bootstrap failure disposes the partial worker, settles pending queries and imposes a five-second cooldown. A later user query creates a fresh worker; there is no background retry loop. Workspace disposal removes providers, workers and pending queries.

Validation: node scripts/test-python-semantic.mjs; Jest semantic-client.test.ts and existing Python lifecycle/markers/runtime tests; tsc --noEmit --incremental false.
