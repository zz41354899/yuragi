# Yuragi project guidance

- Keep library and public APIs in TypeScript with strict type checking.
- The website and primary documentation use Vue; React remains a supported, separately imported adapter.
- Preserve the Momo illustration and original default motion. Use the baseline fixture when changing deformation behavior.
- Keep per-frame state in the engine, outside framework rendering; report UI snapshots at a lower frequency.
- Preserve reduced-motion handling, fallback artwork, SSR-safe imports, cancellable loading, and idempotent resource cleanup.
- Models contain image references and binding data. Do not imply that replacing an image automatically produces a working rig.
- Run npm run typecheck, npm test, and npm run build after library changes. Inspect the live browser for UI changes.
- Package exports and documentation must reflect actual local installation behavior. Do not claim npm publication or MCP/Plugin support until those exist.
- Do not add deployments, publication, image generation, or remote services unless requested.
