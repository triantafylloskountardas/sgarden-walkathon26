# SGarden Total

Unified SGarden project with one root dependency manifest and two app folders:
2
- `frontend/`
- `backend/`

Note: `frontend/package.json` and `backend/package.json` are minimal tool/runtime manifests only. Dependencies are installed and managed from the root `package.json`.

## Prerequisites

- Node.js >= 16
- npm

## Install

Install all dependencies once from project root:

```sh
npm install
```

## Project Structure

```text
sgarden/
  frontend/
  backend/
  package.json
```

## Run Frontend Only

Development server:

```sh
npm run frontend:start
```

Build:

```sh
npm run frontend:build
```

Serve built frontend:

```sh
npm run frontend:serve
```

## Run Backend Only

Development mode (nodemon):

```sh
npm run backend:dev
```

Production mode:

```sh
npm run backend:start
```

## Run Both Frontend And Backend

Development mode (both in parallel):

```sh
npm run dev
```

Production-style run (backend + served frontend build):

```sh
npm run start:all
```

## Lint And Tests

Run all lint checks:

```sh
npm run lint
```

Run all tests:

```sh
npm run test
```
