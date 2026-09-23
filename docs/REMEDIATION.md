# Remediation runbook (owner actions + history purge)

Companion to `review.md`. Items §1 and §2 are **owner-only** and ordered: rotate
credentials FIRST, purge history BEFORE merging `fix/prod-ready-review`.

## 1. Rotate now (credentials are in pushed git history)

History rewriting does not un-leak anything — every credential below must be
considered compromised until rotated:

| Credential | Where it leaked | Action |
|---|---|---|
| Goong REST API key (`GOONG_API_KEY`) | `frontend/.env.development` in commits `f757f84` / `1a6cbfb`, reachable from pushed history | Revoke + reissue in the Goong dashboard; restrict the new key to the server-side proxy origin only |
| Goong maptiles key | same file/commits (browser-visible by design) | Reissue; restrict to exact deployment domains + quota |
| Seeded demo-account passwords (`mogi123`, `user123`, `owner123`, `abc@123` and MD5 forms) | seeders in history | Any deployed DB seeded from that history: delete or reset those accounts |
| MySQL root/user password `***REDACTED***` | `docker-compose.yml` in history (published on 0.0.0.0:3306) | Set fresh `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD` in the operator environment; the current compose refuses to start without them and no longer publishes 3306 |
| `TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` (`***REDACTED***` default) | `backend/.env.local` in history + config defaults | Generate fresh independent values (`openssl rand -hex 32` each); compose requires both |

## 2. Purge history (`scripts/purge-history.sh`)

Exact commands the script runs (from a mirror clone):

```bash
pip install git-filter-repo
git clone --mirror . ../rental-system-purge-mirror.git
cd ../rental-system-purge-mirror.git
git filter-repo --force --invert-paths \
  --path frontend/.env.development \
  --path-glob 'nhatot-crawler/data/*.csv'
```

Then (filter-repo removes `origin` by design):

```bash
git remote add origin <REMOTE_URL>
git push --force --all && git push --force --tags
```

**Warnings**

- Force-push rewrites published history: every existing clone, fork, and open PR
  branch becomes invalid. All collaborators must delete their clone and re-clone.
- Run it on the mirror, verify, then push — never filter-repo a working checkout
  you care about.
- Do this BEFORE merging the remediation branch, so the merge lands on clean
  history (review.md remediation order #1).

## 3. TLS at the edge

The nginx config ships a commented, ready-to-enable 443 server block
(`docker/proxy/conf.d/main.conf`). Cert provisioning is owner-only:

- **certbot / Let's Encrypt (recommended, free):**
  `certbot certonly --webroot -w /var/www/certbot -d your.domain.com`
  (or `--standalone` before the stack is up). Copy/symlink `fullchain.pem` +
  `privkey.pem` into `docker/proxy/certs/`, uncomment the certs volume, the
  `443:443` publish in `docker-compose.yml`, and the SSL server block. Renewals:
  `certbot renew --deploy-hook "docker compose -f docker-compose.yml exec proxy nginx -s reload"`.
- **Cloudflare / ALB / managed LB:** terminate TLS there, forward to :80, and
  set `X-Forwarded-Proto` (the backend now trusts the proxy).

Enable HSTS only after HTTPS is confirmed working end-to-end.

## 4. 13MB demo MP4s (owner's call)

`docs/demo/*.mp4` ≈ 50% of clone cost. Either:

- **Purge:** add the two `--path docs/demo/...mp4` lines (commented in
  `scripts/purge-history.sh`) to the same filter-repo run — free since history
  is already being rewritten; README demo links then need re-hosting (e.g. a
  GitHub release asset), or
- **Accept** the clone cost and keep them in git.

## 5. Crawler cron (currently nothing is scheduled)

Crawlers POST to the public API with `RENTAL_API_EMAIL` / `RENTAL_API_PASSWORD`
from the environment — never hardcode. Example crontab (adjust paths/venv):

```cron
SHELL=/bin/bash
RENTAL_API_EMAIL=crawler@your.domain
RENTAL_API_PASSWORD=<from secret manager>

0 3 * * 1  cd /srv/rental-system/mogi-crawler && ../crawlers-venv/bin/scrapy crawl mogi_spider -o mogi_rentals_data.csv -a pages_limit=3868 >> /var/log/crawlers/mogi.log 2>&1
30 4 * * * cd /srv/rental-system/nhatot-crawler && ../crawlers-venv/bin/python nhatot_crawl.py >> /var/log/crawlers/nhatot.log 2>&1
```

Prefer the wrapper scripts (`mogi-crawler/run_crawl.sh`, `nhatot-crawler/run_crawl.sh`):
each logs a row count and exits non-zero on zero items, so a site redesign no
longer passes silently (fixes review.md, data pipelines). `nhatot-crawler/requirements.txt`
now exists, so CI pip-audit covers it. Remaining gap: no alerting transport —
wire the non-zero exit / row count into your scheduler's alarm (cron MAILTO,
systemd OnFailure, healthchecks.io, etc.).
