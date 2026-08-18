# Admin System Documentation

The admin system is split into focused files in `ui/admin/`.

## File Layout

- `ui/admin/admin-panel.js`: core class, shared lifecycle, common utilities
- `ui/admin/admin-compose.js`: compose tab behavior and write flow
- `ui/admin/admin-upload.js`: upload flow (PDF/MD/TXT), metadata, frontmatter helpers
- `ui/admin/admin-manage.js`: content listing, delete, server archive re-sync
- `ui/admin/admin-settings.js`: cloud sync stats/actions
- `ui/admin/admin-bootstrap.js`: instantiation and startup hook

## Main flows

### Compose

- Writer enters title/type/mood/content
- Frontmatter is generated
- Piece is parsed and saved to local storage

### Upload

- Supports PDF, markdown, and text
- PDF is converted to markdown via `pdf-converter`
- Saves locally, then cloud sync if enabled

### Manage

- Lists all stored pieces
- Supports delete
- Supports "Sync Server Archive" pull into local storage

### Settings

- Toggle cloud sync
- Manual cloud sync trigger
- Pull from cloud
- Displays sync metrics

## Decision notes

- Admin stays browser-first for responsiveness.
- Storage writes are local-first.
- Optional cloud sync remains asynchronous.
- Functions used by admin (`parseMarkdownFragment`, `formatDate`, rendering refresh hooks) are exposed from app bootstrap.
