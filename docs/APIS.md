# API Documentation

This project currently exposes one archive API route.

## Base Path

- `/api`

## Endpoints

### `GET /api/archive`

Returns all markdown pieces discovered under `server-side/content/`.

Response shape:

```json
[
  {
    "filePath": "./server-side/content/challotte/poems/scars.md",
    "markdown": "---\ntitle: ...\n---\n..."
  }
]
```

### Notes

- Files are recursively discovered.
- Only `.md` files are included.
- Results are sorted by file path for stable output.

### Error response

```json
{
  "error": "Failed to load archive from server"
}
```

Status code:
- `500` when content read fails.

## Design rationale

- Keep API intentionally minimal.
- Let frontend parse markdown/frontmatter so rendering logic stays client-side.
- Preserve original markdown for portability and future tooling.
