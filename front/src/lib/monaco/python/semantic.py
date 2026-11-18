"""Static editor assistance. Never evaluate student expressions or import their code."""
import json
import jedi


def semantic_query(code, line, column, kind):
    script = jedi.Script(code=code, path='/home/pyodide/editor.py')
    if kind == 'complete':
        return json.dumps([{'label': c.name, 'kind': c.type, 'detail': c.description} for c in script.complete(line, column)][:300])
    if kind == 'hover':
        return json.dumps([{'label': n.name, 'detail': n.description, 'doc': n.docstring()[:3000]} for n in script.infer(line, column)][:5])
    return json.dumps([{'label': s.to_string(), 'parameters': [p.to_string() for p in s.params], 'activeParameter': s.index or 0} for s in script.get_signatures(line, column)][:10])

