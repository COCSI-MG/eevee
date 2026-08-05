# Python Pytest Worker

Worker image for running Python assignments with pytest.

## Runtime contract

Same pattern as the Node.js workers:

- student source code is written under `/app/src` (e.g. `app.py`)
- validation tests are written under `/app/test` (e.g. `0-template.test.py`)
- `trigger.py` runs `pytest` against `/app/test` with `PYTHONPATH=/app/src`,
  emits a Jest-compatible summary line (`Tests: X passed, Y total`) so the
  scheduler log parser keeps working unchanged, and exits with pytest's exit
  code.

The test summary is also persisted as JUnit XML at `/app/test-results.xml`.

## Included packages

- `pytest` (see `requirements.txt`)

## Build and load

```bash
cd node-worker-images
make build-python-default
make load-python-default
```

Or manual build:

```bash
docker build -t worker-python-default-img:latest -f ./python-default/Dockerfile ./python-default
minikube image load worker-python-default-img:latest
```

## Local run

```bash
# simulate the bootstrap layout
mkdir -p /tmp/eevee-py/src /tmp/eevee-py/test
printf 'def sum(a, b):\n    return a + b\n' > /tmp/eevee-py/src/app.py
printf 'from app import sum\n\ndef test_sum():\n    assert sum(1, 2) == 3\n' > /tmp/eevee-py/test/test_app.py

docker run --rm -v /tmp/eevee-py/src:/app/src -v /tmp/eevee-py/test:/app/test \
  worker-python-default-img:latest
```

Expected output ends with:

```
Tests:       1 passed, 1 total
Failed:      0
```
