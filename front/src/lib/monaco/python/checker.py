"""Parse and lint source without ever executing student code."""
import ast
import json

try:
    from pyflakes.checker import Checker
except ImportError:
    Checker = None


def check_source(source):
    lines = source.splitlines() or [""]

    def column(line, offset, byte_offset=False):
        text = lines[max(0, min(line - 1, len(lines) - 1))]
        if byte_offset:
            prefix = text.encode("utf-8")[:max(0, offset)].decode("utf-8", "ignore")
        else:
            prefix = text[:max(0, offset)]
        # Monaco counts UTF-16 code units; Python uses characters / AST UTF-8 bytes.
        return len(prefix.encode("utf-16-le")) // 2 + 1

    try:
        tree = ast.parse(source, filename="<student>")
        # AST parsing alone accepts e.g. `return` outside a function.
        compile(tree, "<student>", "exec")
    except (SyntaxError, IndentationError) as error:
        line = error.lineno or 1
        end_line = max(line, error.end_lineno or line)
        return json.dumps([{
            "line": line,
            "column": column(line, (error.offset or 1) - 1),
            "endLine": end_line,
            "endColumn": column(end_line, (error.end_offset or error.offset or 1) - 1),
            "message": error.msg,
            "severity": "error",
        }])

    diagnostics = []
    if Checker is not None:
        try:
            for message in Checker(tree, filename="<student>").messages:
                start = column(message.lineno, message.col, byte_offset=True)
                diagnostics.append({
                    "line": message.lineno, "column": start,
                    "endLine": message.lineno, "endColumn": start + 1,
                    "message": message.message % message.message_args,
                    "severity": "warning",
                })
        except Exception as error:
            # Optional lint must never take down syntax diagnostics.
            print("Python lint unavailable:", error)
    return json.dumps(diagnostics)
