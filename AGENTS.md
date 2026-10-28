# Working on this content pack

Read README.md, package.json, arcadia-sdk.json, content.json, src/effects.ts and the tests before editing. The coding-agent workflow is in .agents/skills/arcadia-content-authoring/SKILL.md.

- Use the host-injected SDK and canonical mark prototypes. Prefer the existing native triggers/when/apply API for simple effects; existing binding helpers remain optional.
- Keep stable project/namespace/content/use/binding identities unless a breaking identity change is requested. Run npm run rename before first sharing to customize the template.
- Use the battle RNG. Put persistent state in supported engine instances, parameters and bindings rather than shared module variables.
- Run npm test after behavior changes. It checks the actual npm artifact in the real engine; preserve meaningful assertions and fix implementation errors.
- Run npm run demo to inspect a complete battle and npm run pack to inspect the distributed package.
- SDK packages are not assumed to exist on npm: use npm run setup, which builds the pinned upstream commit, or supply a trusted local SDK with --sdk-dir.
- Do not add a new effect language, generic effect form, or browser UGC execution path. Keep production installation/admission and npm publishing separate from local tests.
