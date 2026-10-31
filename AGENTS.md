# Working on this content pack

Read README.md, package.json, arcadia-sdk.json, data/, arcadia.config.mjs, src/effects.ts and the tests before editing. The coding-agent workflow is in .agents/skills/arcadia-content-authoring/SKILL.md.

- Edit JSON/YAML source files under data/species, data/skills, data/marks. dist/content.json is generated; do not edit it.
- Keep gameplay records media-free. Edit data/presentations for object targets and role references; edit data/resources for stable resource IDs, kind and source. Choose battle.renderer explicitly. HTTP/HTTPS references remain URLs: do not predownload or add resource caches.
- Keep localized names and ICU rich descriptions in locales/<language>/<namespace>.yaml. dist/presentation.json is generated. When renaming the namespace, also update full IDs in rich-text mark references; rename only rewrites structured references.
- Define effects once in TypeScript and reference their IDs from skills/marks; do not add arcadia.exports or duplicate behavior metadata.
- Use the host-injected SDK and canonical mark prototypes. Prefer the existing native triggers/when/apply API for simple effects; existing binding helpers remain optional.
- Keep stable project/namespace/content/use/binding identities unless a breaking identity change is requested. Run npm run rename before first sharing to customize the template.
- Use the battle RNG. Put persistent state in supported engine instances, parameters and bindings rather than shared module variables.
- Run npm test after behavior changes. It checks the actual npm artifact in the real engine; preserve meaningful assertions and fix implementation errors.
- Run npm run demo to inspect a complete battle and npm run pack to inspect the distributed package.
- SDK packages are not assumed to exist on npm: use npm run setup, which loads the upstream installer and installs the tool and SDK from the pinned upstream commit, or supply a trusted local SDK with --sdk-dir.
- Do not add a new effect language, generic effect form, or browser UGC execution path. Keep production installation/admission and npm publishing separate from local tests.

Build/check/rename/demo/pack are provided by @arcadia-eternity/content-dev in the main repository. Do not copy its implementation or generic tooling tests into this template. Keep only project content, effects, scenario configuration and behavior tests here.
