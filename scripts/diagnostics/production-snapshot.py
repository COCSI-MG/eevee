"""Execute on the SSH jump host: bounded reads, no deployment or workload creation.

Streams sanitized JSON only; never returns pod environments, student logs, auth
configuration, query bodies or secrets. No API heap metrics are inferred from RSS.
"""
import datetime
import json
import subprocess
import time
import urllib.parse

NAMESPACE = 'eevee-cefetrj'
errors = []


def kube(args, parse=True, server=None):
    cmd = ['kubectl', '--request-timeout=6s']
    if server:
        cmd += ['--server', server]
    try:
        result = subprocess.run(cmd + args, capture_output=True, text=True, timeout=9)
        if result.returncode:
            # Error classes only: raw diagnostics can include sensitive details.
            error = ('forbidden' if 'Forbidden' in result.stderr else
                     'tls' if 'certificate' in result.stderr.lower() else
                     'connection-refused' if 'connection refused' in result.stderr.lower() else
                     'timeout' if 'timeout' in result.stderr.lower() else 'command-failed')
            return None, error
        return (json.loads(result.stdout) if parse else result.stdout), None
    except subprocess.TimeoutExpired:
        return None, 'timeout'
    except (ValueError, OSError):
        return None, 'invalid-output-or-command'


def read(args):
    value, error = kube(args)
    if error:
        errors.append({'operation': ' '.join(args[:3]), 'error': error})
    return value or {}


def main():
    pods = read(['get', 'pods', '-n', NAMESPACE, '-o', 'json']).get('items', [])
    nodes = read(['get', 'nodes', '-o', 'json']).get('items', [])
    pod_metrics = read(['get', '--raw', '/apis/metrics.k8s.io/v1beta1/namespaces/' + NAMESPACE + '/pods']).get('items', [])
    node_metrics = read(['get', '--raw', '/apis/metrics.k8s.io/v1beta1/nodes']).get('items', [])
    metrics_by_pod = {p['metadata']['name']: p for p in pod_metrics}
    metrics_by_node = {n['metadata']['name']: n for n in node_metrics}
    inventory = []
    for pod in pods:
        status = pod.get('status', {})
        containers = []
        for c in pod.get('spec', {}).get('containers', []):
            cs = next((x for x in status.get('containerStatuses', []) if x['name'] == c['name']), {})
            ended = cs.get('lastState', {}).get('terminated', {})
            containers.append({'name': c['name'], 'resources': c.get('resources', {}),
                               'restarts': cs.get('restartCount', 0),
                               'lastTermination': {k: ended[k] for k in ('reason', 'exitCode', 'finishedAt') if k in ended}})
        metric = metrics_by_pod.get(pod['metadata']['name'])
        inventory.append({'name': pod['metadata']['name'], 'uid': pod['metadata']['uid'],
                          'app': pod['metadata'].get('labels', {}).get('app'),
                          'node': pod.get('spec', {}).get('nodeName'), 'phase': status.get('phase'),
                          'ready': any(c['type'] == 'Ready' and c['status'] == 'True' for c in status.get('conditions', [])),
                          'containers': containers,
                          'metric': {k: metric[k] for k in ('timestamp', 'window', 'containers') if k in metric} if metric else None})
    node_inventory = []
    for node in nodes:
        name = node['metadata']['name']
        metric = metrics_by_node.get(name)
        node_inventory.append({'name': name, 'unschedulable': node.get('spec', {}).get('unschedulable', False),
                               'conditions': [{k: c[k] for k in ('type', 'status', 'lastTransitionTime') if k in c}
                                              for c in node.get('status', {}).get('conditions', [])],
                               'allocatable': node.get('status', {}).get('allocatable', {}),
                               'metric': {k: metric[k] for k in ('timestamp', 'window', 'usage') if k in metric} if metric else None})
    # Discover API backends from the Kubernetes Service, not guessed host addresses.
    endpoints, endpoint_error = kube(['get', 'endpoints', 'kubernetes', '-n', 'default', '-o', 'json'])
    backends = [('current-context', None)]
    if endpoints:
        for subset in endpoints.get('subsets', []):
            for port in subset.get('ports', []):
                for address in subset.get('addresses', []):
                    ip = address['ip']
                    host = '[' + ip + ']' if ':' in ip else ip
                    name = address.get('nodeName') or 'backend-' + str(len(backends))
                    backends.append((name, 'https://' + host + ':' + str(port['port'])))
    if endpoint_error:
        errors.append({'operation': 'discover-api-backends', 'error': endpoint_error})
        current, config_error = kube(['config', 'view', '--minify', '-o', 'jsonpath={.clusters[0].cluster.server}'], parse=False)
        if current and not config_error:
            parsed = urllib.parse.urlparse(current.strip())
            port = parsed.port or 443
            # Control-plane roles come from cluster node metadata; no unrelated hosts/port scan.
            for node in nodes:
                labels = node['metadata'].get('labels', {})
                if not any(k in labels for k in ('node-role.kubernetes.io/control-plane', 'node-role.kubernetes.io/master')):
                    continue
                address = next((a['address'] for a in node.get('status', {}).get('addresses', []) if a['type'] == 'InternalIP'), None)
                if address:
                    host = '[' + address + ']' if ':' in address else address
                    backends.append((node['metadata']['name'], 'https://' + host + ':' + str(port)))
    # Only service/canary pods; tail=0 verifies the log route without fetching contents.
    probes = []
    for name in sorted({p.get('spec', {}).get('nodeName') for p in pods if p.get('spec', {}).get('nodeName')}):
        pod = next((p for p in pods if p.get('spec', {}).get('nodeName') == name
                    and p.get('status', {}).get('phase') == 'Running'
                    and not p['metadata'].get('deletionTimestamp')
                    and p['metadata'].get('labels', {}).get('app') in
                    ('platform-api', 'assignment-runner', 'eevee-front', 'postgres', 'postgres-deployment', 'redis')), None)
        if not pod:
            # Completed worker pods also allow a zero-content route check. Fetch no student logs.
            pod = next((p for p in pods if p.get('spec', {}).get('nodeName') == name
                        and p.get('status', {}).get('phase') in ('Succeeded', 'Failed')
                        and not p['metadata'].get('deletionTimestamp')
                        and any(o.get('kind') == 'Job' for o in p['metadata'].get('ownerReferences', []))), None)
        if not pod:
            probes.append({'node': name, 'logAccess': None, 'reason': 'no existing service pod for a read-only log-route probe'})
            continue
        for backend, server in backends[:4]:
            start = time.monotonic()
            _, error = kube(['logs', pod['metadata']['name'], '-n', NAMESPACE,
                             '-c', pod['spec']['containers'][0]['name'], '--tail=0'], parse=False, server=server)
            probes.append({'node': name, 'backend': backend, 'pod': pod['metadata']['name'],
                           'logAccess': error is None, 'error': error,
                           'durationMs': round((time.monotonic() - start) * 1000), 'method': 'existing pod, tail=0; no log content'})
    # cgroup/process observations only; no shell environment is printed.
    command = ['exec', '-n', NAMESPACE, 'deployment/platform-api-deployment', '--', 'sh', '-c',
               'grep -E "^(VmRSS|VmHWM|Threads):" /proc/1/status; '
               'for p in /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.max '
               '/sys/fs/cgroup/memory.events /sys/fs/cgroup/memory/memory.usage_in_bytes '
               '/sys/fs/cgroup/memory/memory.limit_in_bytes; do '
               'if [ -r "$p" ]; then printf "%s\\n" "$p"; cat "$p"; fi; done']
    memory, memory_error = kube(command, parse=False)
    report = {'schemaVersion': 1, 'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'namespace': NAMESPACE, 'mode': 'production-read-only-predeployment',
              'nodes': node_inventory, 'pods': inventory, 'logRoutes': probes,
              'apiProcessAndCgroup': {'observations': memory, 'error': memory_error}, 'errors': errors,
              'limitations': ['No canaries or new metrics listener were deployed',
                              'Existing service log-route probes are not worker execution tests',
                              'No V8 heap/GC/latency telemetry is available from this snapshot',
                              'No stability history yet; no nodes are certified or scheduling policies changed',
                              'Metrics API data may be missing/stale; timestamps are preserved']}
    print(json.dumps(report))


if __name__ == '__main__':
    main()
