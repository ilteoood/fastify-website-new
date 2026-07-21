---
title: Server
description: The Fastify factory and server lifecycle.
section: Reference
order: 2
---

# Server

The `Fastify()` factory creates a new instance. Common options:

```js
const fastify = Fastify({
  logger: true,           // enable Pino logging
  trustProxy: true,       // honour X-Forwarded-* headers
  bodyLimit: 1048576,     // max request body, in bytes
  disableRequestLogging: false,
})
```

## Listening

```js
await fastify.listen({ port: 3000, host: '0.0.0.0' })
```

## Lifecycle hooks

Fastify exposes hooks throughout the request/response lifecycle:

| Hook | When it runs |
| --- | --- |
| `onRequest` | As soon as a request is received |
| `preParsing` | Before the payload is parsed |
| `preValidation` | Before schema validation |
| `preHandler` | Before the route handler |
| `onSend` | Before the response is serialized and sent |
| `onResponse` | After the response has been sent |

```js
fastify.addHook('onRequest', async (request, reply) => {
  request.log.info('incoming request')
})
```
