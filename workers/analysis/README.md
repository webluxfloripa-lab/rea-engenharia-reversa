# Analysis worker boundary

`REAAdapter.mjs` is a real, bounded local CLI adapter. It reads the pinned REA installation, admits only directories within an explicitly authorized root, uses a fixed argument list, never executes the supplied source, and retains the complete CLI result. It supports an AbortSignal and a 180 second deadline, with owned-child process-group termination on Linux.

It is **not** a deployed production worker, durable queue or sandbox. Before exposing it to user jobs, provision an authorized container/VM runner, network-denied filesystem sandbox, private object store, malware quarantine, durable queue with leases/idempotence, server-side tenant credentials, resource limits and monitoring. No inbound MCP or debugging port is provisioned here.

Android requires full JDK 17+ and the REA-pinned JADX headless bridge with independently verified release hash. Website analysis requires Chromium and a network policy rejecting private/metadata addresses on DNS resolution and every redirect. Sites Workers cannot launch these native processes. These features remain blocked in the public API. No paid services are activated.

CI runs the adapter/CLI only against the checked-in Atlas fixture. CI is verification, not a production backend.
