---
title: Plugins guide
description: Compose your application with encapsulated plugins.
section: Guides
order: 2
---

# Plugins guide

Everything in Fastify is a plugin. Plugins let you encapsulate routes,
decorators, and hooks so large applications stay organized.

## Registering a plugin

```js
import Fastify from 'fastify'

const app = Fastify()

async function routes(fastify, options) {
  fastify.get('/health', async () => ({ status: 'ok' }))
}

app.register(routes)
await app.listen({ port: 3000 })
```

## Encapsulation

By default, anything you add inside a plugin (decorators, hooks, routes) is
scoped to that plugin and its children. To share something with the whole
application, wrap your plugin with
[`fastify-plugin`](https://github.com/fastify/fastify-plugin).

```js
import fp from 'fastify-plugin'

export default fp(async function (fastify) {
  fastify.decorate('utility', () => 'available everywhere')
})
```

See the [Plugins reference](/docs/reference/plugins/) for the full API.
