# DNS settings for everycountryisunique.com

**Registrar / DNS host:** TransIP.

**Email:** Not used. No MX, SPF, DKIM, DMARC, or other mail records.

Related: [infrastructure.md](infrastructure.md).

---

## Host layout

| Host | Purpose | Provider |
|------|---------|----------|
| `everycountryisunique.com` (apex `@`) | Redirect to `www` (308) | Vercel |
| `www.everycountryisunique.com` | Next.js frontend (canonical) | Vercel |
| `api.everycountryisunique.com` | NestJS API | Railway |

CORS on the API allows only:

- `https://everycountryisunique.com`
- `https://www.everycountryisunique.com`
- `http://localhost:3000`

Do not use a wildcard (`*`) record. Only `@`, `www`, and `api` are needed.

---

## Records

**TTL:** 1 Minute for all records (for now).

Traffic is low, so the extra resolver re-queries from a short TTL are negligible. A 1-minute TTL makes DNS mistakes and provider changes show up quickly while the site is still being set up. Raise it later (e.g. to 1 hour) once the records are stable and you want slightly less DNS chatter.

### Frontend (Vercel)

From `vercel domains verify` (2026-08-08), project `physicalattractions-projects/frontend`.
Keep nameservers at TransIP (do **not** switch to `ns1.vercel-dns.com` / `ns2.vercel-dns.com`, or you will have to re-host the `api` Railway records on Vercel DNS).

| Name | TTL | Type | Value | Notes |
|------|-----|------|-------|-------|
| `@` | 1 Minute | A | `216.198.79.1` | Vercel recommended apex (rank 1); add both A records |
| `@` | 1 Minute | A | `64.29.17.1` | Second recommended apex A |
| `www` | 1 Minute | CNAME | `8e99e9a773becd67.vercel-dns-017.com.` | Project-specific Vercel target |

Remove any old VPS A/AAAA (or other) records for `@` and `www` so only these remain.

Both hostnames are attached to the Vercel project. Canonical host is `www.everycountryisunique.com`; the apex redirects to it with HTTP 308 (Vercel project domain redirect).

### API (Railway)

| Name | TTL | Type | Value | Notes |
|------|-----|------|-------|-------|
| `api` | 1 Minute | CNAME | `4fhf74sg.up.railway.app.` | Railway traffic-route host (public) |
| `_railway-verify.api` | 1 Minute | TXT | `railway-verify=e82ff132cf07b8716a40c422379b8234be2dbd57cb4a0e0d57c875a60fbd06fc` | Ownership verification |

Do not combine a CNAME for `api` with an A or AAAA on the same name.

---

## Verify

```bash
dig +short everycountryisunique.com A
dig +short www.everycountryisunique.com CNAME
dig +short api.everycountryisunique.com CNAME

curl -I https://everycountryisunique.com
curl -I https://www.everycountryisunique.com
curl -sS https://api.everycountryisunique.com/health
```

Expected: apex/`www` resolve to Vercel; `api` CNAMEs to Railway; health returns JSON `status: ok`.
