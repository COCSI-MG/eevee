"""Run against either built image: python smoke.py IMAGE (requires Docker)."""
import pathlib
import subprocess
import sys
import tempfile
import time
import uuid

image = sys.argv[1]


def docker(*args, check=True):
    return subprocess.run(['docker', *args], text=True, encoding='utf-8', capture_output=True,
                          check=check, timeout=180)


with tempfile.TemporaryDirectory(prefix='eevee-pg-') as directory:
    root = pathlib.Path(directory)
    (root / 'src').mkdir()
    (root / 'test').mkdir()
    (root / 'src/main.ts').write_text('export {};', encoding='utf-8')
    test = """
const { Client } = require('pg');
test('database is seeded and credentials work', async () => {
  const client = new Client({host: 'localhost', port: 5432, user: 'postgres',
    password: 'postgres', database: 'eevee'});
  await client.connect();
  try {
    const result = await client.query('SELECT value FROM seed');
    expect(result.rows[0].value).toBe('quoted " $() \\u2603');
  } finally { await client.end(); }
});
export {};
"""
    for suffix in ['spec.ts', 'e2e-spec.ts']:
        (root / f'test/database.{suffix}').write_text(test, encoding='utf-8')
    seed = root / 'test/init.sql'
    seed.write_text("CREATE TABLE seed(value text); INSERT INTO seed VALUES ('quoted \" $() \u2603');", encoding='utf-8')

    def run_case(command=(), expected=0, seed_enabled=True):
        name = 'eevee-pg-smoke-' + uuid.uuid4().hex[:12]
        args = ['run', '--name', name,
                '-v', f'{root / "src"}:/app/src', '-v', f'{root / "test"}:/app/test']
        if seed_enabled:
            args += ['-e', 'EEVEE_INIT_SQL_FILE=/app/test/init.sql']
        try:
            result = docker(*args, image, *command, check=False)
            assert result.returncode == expected, result.stdout + result.stderr
            state = docker('inspect', '--format', '{{.State.Running}}', name).stdout.strip()
            assert state == 'false', state
            return result.stdout + result.stderr
        finally:
            docker('rm', '-fv', name, check=False)

    logs = run_case()
    assert 'Tests:' in logs or 'Test Suites:' in logs, logs
    run_case(('node', '-e', 'process.exit(7)'), expected=7, seed_enabled=False)
    seed.write_text('THIS IS INVALID SQL;', encoding='utf-8')
    logs = run_case(('node', '-e', 'console.log("TRIGGER_STARTED")'), expected=3)
    assert 'TRIGGER_STARTED' not in logs, logs

    name = 'eevee-pg-cancel-' + uuid.uuid4().hex[:12]
    try:
        docker('run', '-d', '--name', name, image, 'node', '-e',
               'require("http").createServer().listen(3000, () => console.log("READY"))')
        for _ in range(45):
            logs = docker('logs', name).stdout
            if 'READY' in logs:
                break
            time.sleep(1)
        else:
            raise AssertionError('HTTP worker did not start: ' + logs)
        docker('stop', '-t', '15', name)
        code = docker('inspect', '--format', '{{.State.ExitCode}}', name).stdout.strip()
        assert code == '143', 'Signal was not handled gracefully: ' + code
    finally:
        docker('rm', '-fv', name, check=False)

print('PASS: seeded trigger, failure status, invalid SQL, and cancellation:', image)
