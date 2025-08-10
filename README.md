PasswordManager
Login & Key Generator (Node/Express)

Small, secure starter that combines a bcrypt-based login with a per-user key generator.
Frontend is a minimal static page; backend is Node/Express with a clean, modular structure.

Features
Login

Users stored in usuarios.json as a map: {"username": "bcryptHash", ...}.

Uses a dummy bcrypt hash to avoid username enumeration (timing side-channels).

Simple per-IP lockout after repeated failures.

Per-user key generator

Derives short, URL-safe keys from (username + word) using SHA-256 iterated n times.

The input word is never stored in plaintext. For each user, we keep HMAC-SHA256(username:word) → n.

Modes: nuevo (reset to 1), igual, mas (n+1), menos (n−1).

Audit

Logs every API hit (IP + endpoint + timestamp) to ips.jsonl.

Project Structure
text
Copy
Edit
tu-proyecto/
├─ public/
│  ├─ index.html
│  └─ app.js
├─ src/
│  ├─ server.js          # builds the Express app
│  ├─ index.js           # starts the server (entrypoint)
│  ├─ config.js          # env + paths + constants
│  ├─ routes/
│  │  ├─ auth.js         # POST /login
│  │  └─ keys.js         # POST /generar-clave
│  ├─ middleware/
│  │  └─ rateLimit.js    # simple per-IP throttle/lock
│  ├─ utils/
│  │  ├─ crypto.js       # b64url, HMAC(word), deriveKey
│  │  └─ ip.js
│  └─ lib/
│     ├─ users.js        # loads usuarios.json (map)
│     ├─ words.js        # per-user words store (JSON file)
│     └─ log.js          # JSONL IP logger
├─ usuarios.json         # { "username": "bcrypt-hash", ... }
├─ palabras/             # one JSON per user (auto-created)
├─ ips.jsonl             # IP audit log (auto-created)
├─ .env                  # optional env vars
└─ package.json
API
POST /login
Verifies credentials with bcrypt. Responds with the same message whether the user exists or not.

Request

json
Copy
Edit
{ "usuario": "ignacio", "clave": "myPassword" }
Success

json
Copy
Edit
{ "exito": true, "mensaje": "Inicio de sesión exitoso" }
Failure

json
Copy
Edit
{ "exito": false, "mensaje": "Usuario o contraseña incorrectos" }
POST /generar-clave
Creates a short derived key for a (usuario, palabra) pair.
Stores only HMAC(username:word) → n per user; never the word itself.

Request

json
Copy
Edit
{ "usuario": "ignacio", "palabra": "family", "modo": "mas" }
modo ∈ { "nuevo", "igual", "mas", "menos" }

Response

json
Copy
Edit
{ "exito": true, "clave": "w8f2KqZb1GJm4PqR", "n": 3 }
Security Model (tl;dr)
Passwords: stored with bcrypt (keep the full $2b$... string).

No username leaks: compares against a DUMMY_HASH when the user doesn’t exist; identical error message either way.

Words storage: per-user file palabras/<username>.json with { "<HMAC>": n }.

HMAC uses server-side PEPPER: HMAC-SHA256(username:word, PEPPER_KEYS) → Base64-URL.

Generated key = first 16 chars of Base64-URL(SHA-256 iterated n times on (username + word)).

Rate limiting: in-memory per IP; locks for 1 minute after too many failures.

Audit: simple JSONL log for requests.

Setup
1) Install
bash
Copy
Edit
npm i
2) Environment (.env)
ini
Copy
Edit
PORT=3000
TRUST_PROXY=true
PEPPER_KEYS=replace-with-a-long-random-secret
DUMMY_HASH=$2b$10$IX5J0z7sCgh1P2G7y2N7Aej8H5QF7z2mQw1kYbY0r9x3c0p9o7C2K
DUMMY_HASH must be a valid bcrypt hash (e.g., of "dummy-password"). Generate your own if you prefer.

3) Create users
Use the helper script to add/update users in usuarios.json:

bash
Copy
Edit
# interactive (asks user & password)
npm run addUser

# with options
npm run addUser -- ignacio --rounds=12
npm run addUser -- ignacio --force
This writes to usuarios.json:

json
Copy
Edit
{
  "ignacio": "$2b$12$...bcryptHash..."
}
4) Run
bash
Copy
Edit
npm run dev   # nodemon (development)
npm start     # production-ish
# => http://localhost:3000
Frontend
Minimal UI in public/index.html + public/app.js:

POST /login to authenticate.

After success, shows inputs to call POST /generar-clave with palabra and modo, and displays the derived key.

Example (cURL)
bash
Copy
Edit
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"ignacio","clave":"myPassword"}'

# Generate key (increment n)
curl -X POST http://localhost:3000/generar-clave \
  -H "Content-Type: application/json" \
  -d '{"usuario":"ignacio","palabra":"family","modo":"mas"}'
Notes
Keep usuarios.json and palabras/ outside any public/static directory.

Rotate PEPPER_KEYS carefully (it “blinds” HMAC values; rotation strategy depends on your needs).

Consider persisting rate-limit state (e.g., Redis) if you run multiple instances.

For larger deployments, swap JSON files for SQLite/PostgreSQL.

Do not expose endpoints that list users or words.

License
MIT © 2025 Ignacio Romero
