# Python Pytest Worker

Worker image for running Python assignments with pytest.

## Runtime contract

- Student source code is written under `/app/src`.
- Validation tests are written under `/app/test`.
- `trigger.py` runs pytest with `/app/src` on `PYTHONPATH`.
- Test output includes the summary consumed by Assignment Runner.
- JUnit results are persisted at `/app/test-results.xml`.

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
