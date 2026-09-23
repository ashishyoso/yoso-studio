# Product: yoso-studio
type: product

## Scope
Code and product docs for yoso-studio.

## Rules
- Dev context comes from the router. Runtime knowledge comes only from the compiled kb in Supabase (table kb_entries, exposure = product).
- Never read clients/, functions/ or restricted/.
- Never vendor kb or skills files into this repo. Fetch at build or runtime.

This repo is PUBLIC. Nothing from the workspace router, context/, kb/ or any unit is ever written into a committed file here.
