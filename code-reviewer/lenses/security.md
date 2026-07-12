# Security

Find exploitable weaknesses introduced or worsened by the diff: injection, missing authorization, secret exposure, and unsafe handling of untrusted input.

## Criteria

- **Injection** — untrusted input reaching SQL/NoSQL queries, shell commands, `eval`-like sinks, HTML (XSS), or log lines (log injection) without parameterization or encoding appropriate to the sink.
- **Missing or weakened authorization** — new endpoints/handlers without an authz check the sibling endpoints have; checks moved client-side; object-level access without ownership verification (IDOR).
- **Secret exposure** — credentials, tokens, or keys hardcoded, logged, returned in responses, or committed in config/fixtures.
- **Unsafe deserialization / parsing** — untrusted data fed to permissive parsers or dynamic constructors; prototype pollution paths in JS/TS merges.
- **Path traversal & file handling** — user-controlled paths joined without normalization/containment checks; archive extraction without entry-path validation.
- **SSRF** — user-controlled URLs fetched server-side without allow-listing or scheme/host validation.
- **Crypto misuse** — homegrown crypto, weak hashes for passwords, static IVs/nonces, non-constant-time comparison of secrets, disabled TLS verification.
- **Trust-boundary regression** — validation removed or relaxed at a boundary; sensitive defaults loosened (CORS `*`, cookie flags dropped, debug endpoints enabled).

Judge reachability: a sink is only a finding if untrusted data can actually reach it. Trace the path and cite it.

## Severity

- blocker: exploitable by an unauthenticated or low-privilege actor, or leaks secrets/PII
- warning: exploitable only with elevated preconditions, or a defense-in-depth layer removed
- note: hardening gap with no currently reachable untrusted path
