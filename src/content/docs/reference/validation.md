---
title: Validation & Serialization
description: Validate requests and serialize responses with JSON Schema.
section: Reference
order: 3
---

# Validation & Serialization

Fastify uses JSON Schema to validate incoming requests and to serialize
outgoing responses. Internally the schema is compiled into a highly performant
function.

```js
fastify.route({
  method: 'GET',
  url: '/',
  schema: {
    querystring: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
    response: {
      200: {
        type: 'object',
        properties: { hello: { type: 'string' } },
      },
    },
  },
  handler: async (request, reply) => {
    return { hello: request.query.name }
  },
})
```

## Why it's fast

Serializing with a known schema lets Fastify skip generic `JSON.stringify`
work and emit output through a specialized function — often several times
faster.

## Type providers

Pair schemas with a type provider such as
[`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod)
for end-to-end type safety.
