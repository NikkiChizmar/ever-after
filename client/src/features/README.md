# Features

Each product domain lives in its own folder here — `budget/`, `guests/`, `vendors/`,
`timeline/`, and so on — containing that feature's components, hooks, API calls, and types:

```
features/
  budget/
    components/   # UI specific to this feature
    hooks/        # Feature-scoped state and data hooks
    api.ts        # API calls for this domain
    types.ts      # Domain types
```

**Why feature-based instead of type-based** (all components in one giant
`components/` folder): code that changes together lives together. When you work on
the budget, everything you need is in one place — and deleting or refactoring a
feature is a folder operation, not a scavenger hunt.

Shared building blocks live outside this folder:

- `components/ui/` — shadcn/ui primitives (buttons, cards, dialogs)
- `components/layout/` — app shell, navigation
- `hooks/` — genuinely cross-feature hooks
- `lib/` — utilities
