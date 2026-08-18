# Admin Access & Security

Two things protect the admin panel and your archive data. Set both up before
sharing the site publicly.

## 1. Admin panel passphrase

The "⚙️ Admin" button now prompts for a passphrase before opening the panel.
The placeholder passphrase is `change-me-now` — **change it** before
deploying.

To set your own:

1. Pick a passphrase.
2. Generate its SHA-256 hash. In a terminal:
   ```bash
   python3 -c "import hashlib; print(hashlib.sha256('your-passphrase-here'.encode()).hexdigest())"
   ```
3. Paste the resulting hash into `ADMIN_PASSPHRASE_HASH` at the top of
   `ui/admin/admin-panel.js`.

The plaintext passphrase is never stored in the code, only its hash, so
casually reading the source doesn't reveal it.

**Limitation:** this is a client-side gate. It stops casual visitors from
opening the panel, but anyone who reads the JavaScript and computes matching
hashes (or who calls the Firebase SDK directly) isn't blocked by it. It's
appropriate for a quiet, low-traffic personal archive — not for content that
needs real security guarantees. The Firestore rules below are the actual
enforcement layer for your data.

## 2. Firestore security rules

`firestore.rules` (repo root) is a template that blocks all writes to your
`pieces` collection unless the request is authenticated — this repo doesn't
currently sign anyone into Firebase, so as shipped, cloud writes are
disabled until you add Firebase Authentication. Reads stay open, since the
public archive needs to load without a login.

Deploy it via the Firebase console (Firestore Database → Rules → paste the
contents of `firestore.rules` → Publish), or with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

If you want cloud sync writes working again, add Firebase Authentication
(Email/Password is simplest for two writers) and sign in before any sync
call — see the comments in `firestore.rules` for details.
