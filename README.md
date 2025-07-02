# next15-app-session

![npm](https://img.shields.io/npm/v/next15-app-session)
![npm bundle size](https://img.shields.io/bundlephobia/min/next15-app-session) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/next15-app-session)
![ts](https://badgen.net/badge/Built%20With/TypeScript/blue?icon=typescript)
![nextjs](https://badgen.net/badge/Built%20for/Next.js%20v15/purple?icon=vercel)
![nextjs](https://badgen.net/badge/Supports:/Redis/orange?icon=redis)

This package is built to work with Next.js v13 App router and Server Components & Actions, additionally it also supports Pages router and middleware.

This Next.js package enables secure storage of sessions in a server side store like `express-session` or `redis` or others, the package uses the next.js dynamic function [cookies()](https://nextjs.org/docs/app/api-reference/functions/cookies) to store the session id on the client side and that session id is then associated with user data on the server store.

Package was inspired by [express-session](https://www.npmjs.com/package/express-session) & [next-session](https://www.npmjs.com/package/next-session).

## Setup

1. Install package in your Next.js project

   ```
   npm i next15-app-session
   ```

2. Create an initialisation file, for example: `lib/session.ts`, and write an exportable session variable like follows:

   ```typescript
   import nextAppSession from 'next15-app-session';

   // Your session data type
   type MySessionData = {
      access_token?: string;
      counter?: number;
   }

   // Setup the config for your session and cookie
   export const session = nextAppSession<MySessionData>({
      // Options
      name: 'SID',
      secret: 'secret goes here' ,
      ...
   });
   ```

3. You can now use `session()` or `session(req)` in your App router & Page router i that order

   #### App router: Route Handler/Server Components/Server Actions

   ```typescript
   await session().get();
   ```

   #### Pages router/middleware:

   ```typescript
   await session(req).get(); // where req is the IncomingMessage/NextApiRequest object
   ```

> Note: in App router, `session` can only read data in [Server Components](https://nextjs.org/docs/getting-started/react-essentials) while it can read+write data in [Route Handler](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) and [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions). It follows the same usage rules as the [cookies() dynamic function](https://nextjs.org/docs/app/api-reference/functions/cookies)

**A Router handler usage example:**

```typescript
// Example for route handler
import { session } from '../lib/session'; //We import it from the initialisation file we created earlier

// Increment counter
export async function POST(request: Request) {
  // Read counter value froms session
  const current = await session().get('counter');

  //Increment value or assign 1 if no value exists
  const newValue = current ? Number(current) + 1 : 1;

  // Update counter session
  await session().set('counter', newValue);
}
```

**Page router usage example:**

```typescript
// Example for route handler
import { session } from '../lib/session'; //We import it from the initialisation file we created earlier

// Serve session as props
export async function getServerSideProps({ req }) {
  // Get data from session
  const data = await session(req).all();

  // Pass data to the page via props
  return { props: { ...data } };
}
```

---

## Options

| Property   | Description                                                                                                                                                                        | Default           |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------- |
| **name**   | Name of the client cookie that holds the session ID                                                                                                                                | 'sid'             |
| **secret** | This is the secret used to sign the session cookie which will hold the user session ID. If left empty the session ID is not signed/encoded                                         |                   |
| **store**  | The session store instance, defaults to a new `MemoryStore` instance which is for dev purposes only, other production compatible stores can be used, more on how to use them below | new MemoryStore() |
| **genid**  | This callback can be used to override the unique session id creation allowing you to set your own, By default nanoid package is used to generate new session IDs                   | nanoid            |
| **cookie** | An object can be passed here to control the configuration of the client cookie                                                                                                     |                   |

---

## Methods

#### `await session().get('key')`

This will fetch the session and return the stored property that matches the key passed to it.

#### `await session().all()`

This will fetch all session data

#### `await session().set('key', value)`

This will set the data with the property key passed

#### `await session().setAll(object)`

This will set all session data

> **Notice:** The session set methods work the same way as the next.js cookies dynamic function, it will only work in the context of Route Handlers & Server Actions. while the get methods will additionally work on the Server Components.

---

## Stores

As we mentioned before by default the package will use `MemoryStore`, which is an express session singleton that lasts until the node process is killed, because of that `MemoryStore` is not recommended for production use. and instead you should consider using other stores such as Redis or a database service.

### How to use a Redis store

1. First setup a redis instance, for exmaple using docker you can add this to your `docker-compose.yml` file

   ```yaml
   version: '3.8'
   services:
     redis:
       image: redis:latest
       ports:
         - '6379:6379'
   ```

2. Run the docker container, in your terminal naviaget to your project and run:

   ```
   docker-compose up
   ```

3. Install redis packages in your project:

   ```
   npm i ioredis connect-redis
   ```

4. Update the session config so its like follows with the port you're redis instance is running on:

   ```typescript
   import nextAppSession, { promisifyStore } from 'next15-app-session';
   import Redis from 'ioredis';
   import RedisStoreFactory from 'connect-redis';

   export const session = nextAppSession({
     name: 'EXAMPLE_SID',
     secret: 'secret goes here',
     // Assign Redis store with connection details
     store: promisifyStore(
       new RedisStore({
         client: new Redis({
           host: 'localhost',
           port: 6381
         }),
         prefix: 'exampleapp:'
       })
     )
   });
   ```

### Other compatible stores

Any [express session store package](https://github.com/expressjs/session/tree/master#compatible-session-stores) should be supported as long as they're passed through `promisifyStore` utility function

## Example

a Next.js demo app is located under `./example` of this repo.

## Contribution

![GitHub issues](https://img.shields.io/github/issues/sweetscript/next15-app-session)

Feedback, Issue reports, suggestions and contributions are welcome and appreciated.

[https://github.com/sweetscript/next15-app-session/issues](https://github.com/sweetscript/next15-app-session/issues)

[https://github.com/sweetscript/next15-app-session/discussions](https://github.com/sweetscript/next15-app-session/discussions)

[majid@sweetscript.com](mailto:majid@sweetscript.com)

## Next.js 15 Compatibility

This library is fully compatible with Next.js 15 and handles the breaking changes introduced in the new version:

- **Async Dynamic APIs**: Next.js 15 made dynamic APIs like `cookies()` asynchronous. This library properly handles these async operations to ensure consistent session state.
- **Race Condition Prevention**: The library includes built-in safeguards against race conditions that can occur when multiple session operations happen concurrently.
- **Automatic Initialization**: Session initialization is handled automatically and efficiently, ensuring that all session operations work correctly even when called in rapid succession.

### Migration from Earlier Versions

If you're upgrading from an earlier version of this library and experiencing issues with Next.js 15:

1. Update to version 1.1.0 or higher
2. No code changes are required - the library handles Next.js 15's async APIs internally
3. If you were experiencing issues where `session.get()` returned `null` unless `session.all()` was called first, this has been fixed
