# affiliate-program-terms

Public mirror of the free tier of [affiliateprogramterms.com](https://affiliateprogramterms.com).
`README.md` is generated — edit `README.template.md` or the source data, never the README.

```
node generate.mjs        # reads ../affterms/data, rewrites README.md
```

## The one rule

**Only free-tier records may appear here.** The tier is resolved from
`../affterms/data/free-tier.json` at generate time rather than restated, so the
boundary cannot drift. Verify after any regeneration that no record outside the
tier reached `README.md`.

Every count in the README is computed by `generate.mjs`. Do not hand-type a
figure into the template — that is how a number goes stale with nothing to catch it.
