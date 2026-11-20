# Python Pytest Worker

Worker image for running Python assignments with pytest.

## Runtime contract

- Student source code is written under `/app/src`.
- Validation tests are written under `/app/test`.
- `trigger.py` runs pytest with `/app/src` on `PYTHONPATH`.
- Test output includes the summary consumed by Assignment Runner.
- Template resources are available to validation tests by filename:
  `from eevee_resources import resource_path`, then
  `pandas.read_csv(resource_path("data.csv"))`. The helper returns a
  `pathlib.Path` and raises an error if the resource is missing.
- JUnit results are persisted at `/app/test-results.xml`.
- Database-backed Python assignments use the separate Python + PostgreSQL worker;
  their task-level SQL seed is applied to a fresh database for every execution.

## Build and load

From `images/`:

```bash
make build-python-default
make load-python-default
```

Or build from the repository root:

```bash
docker build -t worker-python-default-img:latest images/python-default
```

## Smoke test

Mount `examples/base/src` at `/app/src` and `examples/base/test` at `/app/test`,
then run the image. The expected summary is `Tests: 1 passed, 1 total`.
