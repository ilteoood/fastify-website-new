---
title: Plugins
description: The plugin system, encapsulation, and decorators.
section: Reference
order: 4
---

# Plugins

The plugin system is at the heart of Fastify. A plugin can be a set of routes,
a server decorator, or anything else — and it can be registered with options.

```js
fastify.register(
  async function (instance, opts) {
    instance.get('/', async () => ({ scoped: true }))
  },
  { prefix: '/v1' }
)
```

## Decorators

Attach reusable functionality to the instance, request, or reply:

```js
fastify.decorate('db', createConnection())
fastify.decorateRequest('user', null)
```

## Encapsulation & `fastify-plugin`

Decorators and hooks are encapsulated to the plugin scope by default. To expose
them to the parent scope, wrap the plugin with `fastify-plugin`:

```js
import fp from 'fastify-plugin'

export default fp(async function (fastify) {
  fastify.decorate('shared', () => 'global')
})
```

Read the [Plugins guide](/docs/guides/plugins-guide/) for a gentler
introduction.
