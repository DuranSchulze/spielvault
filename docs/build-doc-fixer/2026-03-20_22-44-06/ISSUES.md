# Issues

## 1. /Users/zafajardo/Documents/Development/DuranFilePino/spiel-vault/app/(dashboard)/spiels/new/page.tsx

- Command: npm run lint
- Severity: error
- Status: blocking
- Explanation: The command did not complete successfully, but the output did not match a structured parser rule.
- Proposed fix direction: Review the raw log, identify the first blocking diagnostic, and update the parser if this format should be handled structurally in future runs.

~~~text
/Users/zafajardo/Documents/Development/DuranFilePino/spiel-vault/app/(dashboard)/spiels/new/page.tsx
  156:3  error  Error: Cannot access refs during render
React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).
/Users/zafajardo/Documents/Development/DuranFilePino/spiel-vault/app/(dashboard)/spiels/new/page.tsx:156:3
  154 |   const editorRef = useRef<import("@tiptap/react").Editor | null>(null);
  155 |
> 156 |   insertRef.current = (token: string) => {
      |   ^^^^^^^^^^^^^^^^^ Cannot update ref during render
  157 |     editorRef.current?.chain().focus().insertContent(token).run();
  158 |   };
  159 |  react-hooks/refs
✖ 1 problem (1 error, 0 warnings)
~~~

## 2. Module '"@/lib/utils"' has no exported member 'formatDate'.

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
