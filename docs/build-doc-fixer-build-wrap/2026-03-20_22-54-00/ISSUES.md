# Issues

## 1. Module '"@/lib/utils"' has no exported member 'formatDate'.

- Command: npm run build
- Severity: error
- Status: blocking
- Location: components/spiels/spiel-card.tsx:6
- Explanation: The code imports a symbol that the referenced module does not export, so type checking stops before the build can finish.
- Proposed fix direction: Either export the missing symbol from the target module or replace the import with an existing helper that matches the intended behavior.

~~~text
./components/spiels/spiel-card.tsx:6:10
Type error: Module '"@/lib/utils"' has no exported member 'formatDate'.

  [90m4 |[0m [36mimport[0m { [33mCopy[0m, [33mPencil[0m, [33mTag[0m } [36mfrom[0m [32m"lucide-react"[0m;
  [90m5 |[0m [36mimport[0m [36mtype[0m { [33mSpielWithRelations[0m } [36mfrom[0m [32m"@/types"[0m;
[31m[1m>[0m [90m6 |[0m [36mimport[0m { formatDate } [36mfrom[0m [32m"@/lib/utils"[0m;
  [90m  |[0m          [31m[1m^[0m
  [90m7 |[0m
~~~
