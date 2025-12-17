# Setup instructions

1. Get an .env file from Kevin
2. setup a local/docker postgres & create a db called `complere`
3. pnpm install
4. pnpm migrate 
5. login with OTP from dev console (also sends email)
6. go through "onboarding" (asks the user onboarding questions, creates a `Workspace` for their user)
7. Get to waitlist. Then, manually in the DB, toggle your user to a `isBeta: true` user (lets you see the dashboard at `/app/app/*`) or an `isAdmin: true` (let's you see dashboard + `/app/admin`)
8. to see real LLM HTTP calls, set USE_TEST_PROVIDERS=false

# LLM instructions

- If you must install a new package, use pnpm.
- We don't use server components. Use TRCP, import [react.tsx](mdc:src/trpc/react.tsx) on the client, and extend [root.ts](mdc:src/server/api/root.ts) for endpoints on the server.
- For file locations, prefer putting very light, skeleton-like files in the `app` directy with their `page.tsx` files basically just importing components from ./src/sections/*. 


EVERY SINGLE TIME, REVIEW [schema.prisma](mdc:prisma/schema.prisma) and [root.ts](mdc:src/server/api/root.ts). DO NOT MAKE NEW MODELS OR NEW ENDPOINTS UNLESS DIRECTLY INSTRUCTURED.

## Frontend

- All tsx files must have "use client" at the top
- If you must install a new package, use pnpm
- In general, use shacdn components
- Use shacdn components EXCEPT for the card. Always make a custom card when a card is necessary. 
- Never use <p /> tags. Prefer <div />
- For shadcn components, assume we have them installed. If we do not, use `pnpm dlx shadcn@latest add tabs` syntax.
- Prefer function declaration over expressions.
- Never pull the props of a React component out of the function declaration, unless for some reason we must use them in a file. For example, most components should look like this:

`export function ProfileName({name}: {name: string}) {}`

- We use trcp to interact with the backend. 
- Never call trpc in an async component from the server. We must call it using useQuery or useMutation from the client.
- Don't use grey or muted text. Ever. Unless I ask. 
- When using mutations, prefer to use the LoadingButton found in @button.tsx if possible. This fits nicely with `isLoading={mutation.isLoading}`
- don't forget to invalidate caches with `const utils = api.useUtils();` and `await utils.invite.list.invalidate();` when making upates. 
- Never use a custom toaster. we can use `sonner`. 
- Never say "updated successfully" in messages to users. Use short, concice language like "udpated".
- If we are making a data table, use tanstack's react table and shadcn. 
- For columns, make them in their own file using the following setup as an example:

```ts
import { createColumnHelper } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type ProductStats = RouterOutput["event"]["getProductStatistics"][number];

const columnHelper = createColumnHelper<ProductStats>();

  claimColumnHelper.accessor("name", {
        cell: (props) => {
            const rawStatus = props.getValue();
    // ...
```

- When displaying dates, we almost always prefer using the following:

```tsx
import { formatDistanceToNow } from "date-fns";
<span className="text-xs text-muted-foreground">
  {formatDistanceToNow(
    new Date(study.paidDate),
    {
      addSuffix: true,
    },
  )}
</span>
```

## Backend

- Never, ever, ever try to run Prisma migrate commands yourself. 
- Again, anything like `pnpm prisma migrate dev` IS TOTALLY FORBIDDEN. DON'T DO IT. It doesn't matter if there are lint errors, the integration between prisma & cursor is broken. Ignore the lint errors when it's prisma types, I will fix them.
- Prefer function declaration over expressions
- Never pull the props of a function declaration out of the function signature, unless for some reason we must use them in a file. For example, most components should look like this:

`export function ProfileName({name}: {name: string}) {}`

- We use [schema.prisma](mdc:prisma/schema.prisma) as our ORM. In general, if we are doing something that requires the database model, please look at that file. 
- We use trcp to support the front end with endpoints. The frontend will use the api in @react.tsx, and the backend will use and extend all the routers found in @root.ts. 
- For TRCP endpoints, prefer a light endpoint length. If a handler gets to be too long, consider extracting its core functionality into a function in the /src/services directory.
- Do not use classes or OOP. 
- when using prisma to find an individual record, use `findFirstOrThrow`. That way, we don't need to always have to check if it exists after.
