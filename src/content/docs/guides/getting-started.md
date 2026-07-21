---
title: Getting started
description: Install Fastify and write your first server.
section: Guides
order: 1
---

# Getting started

Hello! Thank you for checking out Fastify.

This document walks you through installing Fastify and creating your first
server.

## Install

Install with your package manager of choice:

```bash
npm install fastify
```

## Your first server

Create `server.js` and add:

```js
// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify({ logger: true })

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
```

Launch it:

```bash
node server
```

And test it:

```bash
curl http://localhost:3000
```

## Using the CLI

Prefer scaffolding? The [fastify-cli](https://github.com/fastify/fastify-cli)
generates a project for you:

```bash
npm install --global fastify-cli
fastify generate myproject
```

Next, learn how to compose your app with [plugins](/docs/guides/plugins-guide/).
