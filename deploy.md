# Deploying Writers

## What went wrong

The Writers website has two parts that are easy to confuse:

1. The **frontend** is the part shown in the browser. It contains the HTML, CSS, and JavaScript files.
2. The **server** is a Node.js program that does work for the frontend. In this project it is started with `node backend/server.js`.

When the website runs locally, the server does two jobs:

- It serves the website files, such as `index.html`, CSS, JavaScript, images, and Markdown content.
- It provides an API endpoint called `/api/archive`.

An API endpoint is a URL that a program uses to ask another program for data. In this case, the browser asks the server:

```text
/api/archive
```

The server receives that request, looks inside `server-side/content/`, finds all the Markdown files, reads them, and sends their contents back to the browser as JSON data. JSON is a structured text format that JavaScript can easily read.

The browser's archive loader is written to call that endpoint:

```js
fetch("/api/archive")
```

This works locally because `backend/server.js` is running and Express knows how to answer the request.

## Why Netlify showed a 404

Netlify was connected to the GitHub repository and successfully served the frontend files. However, Netlify was treating the repository as a static website. A static website can serve files, but it does not automatically run this project's Express server.

That means the deployed browser requested:

```text
https://your-site.netlify.app/api/archive
```

but no Express server was running there to handle the request. Netlify therefore returned `404`, which means "not found."

The browser then tried its backup plan: IndexedDB. IndexedDB is a small database stored inside the visitor's browser. It only contains archive pieces if the site has successfully loaded them before. On a first visit, the database is empty, so the browser reported:

```text
No server archive available and no local cache found
```

The Firebase warning is a separate issue. Firebase is used for optional cloud synchronization. If Firebase has not been configured, cloud sync is disabled, but that does not have to prevent the public archive from loading.

## Two ways to solve it

### Option 1: Keep Netlify as a static host

This is the option we are using for now.

A build script will scan `server-side/content/` before deployment. It will collect every Markdown file and create one static file called `archive.json`. That file will contain the same archive data that the Express API currently creates.

The browser will try the normal `/api/archive` endpoint first. This keeps local development working exactly as it does now. If that endpoint returns a 404 on Netlify, the browser will request `./archive.json` instead.

The deployment flow becomes:

1. Netlify downloads the repository from GitHub.
2. Netlify runs `npm run build`.
3. The build script reads all Markdown files under `server-side/content/`.
4. The build script creates `archive.json` in the published website folder.
5. Netlify publishes the root folder, including `index.html`, `ui/`, `server-side/`, and `archive.json`.
6. A visitor opens the site.
7. The browser tries `/api/archive`.
8. Netlify returns 404 because there is no Express API, so the browser tries `archive.json`.
9. The browser parses the Markdown from the JSON file, displays the works, and saves them to IndexedDB for later fallback use.

This approach is a good fit because Writers is primarily a reading website. The archive can be prepared during deployment and downloaded by visitors as a normal file. It also keeps the deployment simple and does not require a continuously running Node server.

One limitation is that changes to Markdown content require a new Netlify deployment so that `archive.json` can be regenerated. Netlify normally does this automatically when new commits are pushed to the connected GitHub branch.

### Option 2: Deploy the Express backend too

The second option is to host the Node.js server on a platform that can run backend processes, or convert the Express route into a Netlify Function.

With a continuously running Node host, the deployment would start:

```bash
node backend/server.js
```

The server would continue listening for requests and would answer `/api/archive` by scanning the Markdown directory at request time. The frontend would keep using the API exactly as it does locally.

With a Netlify Function, the `/api/archive` route would be moved into a function file, usually under a special functions directory. Netlify would start that function when a visitor requests the endpoint. The function would read the content files and return JSON.

This option is useful when the website needs server-side behavior, user accounts, protected operations, frequent live data changes, or a database-backed API. It is more complicated for this project because it requires backend hosting or a serverless-function setup, environment variables, and possibly changes to file paths and routing.

## Current choice

For now, Writers uses **Option 1: static Netlify hosting with a generated archive file**. The local Express API remains available for local development, while Netlify uses the generated `archive.json` fallback.

## Deployment commands

For local development:

```bash
npm start
```

For the production archive build:

```bash
npm run build
```

After pushing the build configuration and generator to GitHub, Netlify should use:

- Build command: `npm run build`
- Publish directory: `.`

If Netlify is configured to deploy only the `main` branch, make sure the changes are merged into `main` or change Netlify's production branch to the branch containing the deployment changes.
