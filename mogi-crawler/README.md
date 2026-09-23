### Install Python

I assume that you had installed Python on your computer. For installation process, please checkout https://www.python.org/downloads/

### How to use it

```sh
./run_crawl.sh                      # or: PAGES_LIMIT=50 ./run_crawl.sh
```

Output is a timestamped `mogi_after_parsing_<ts>.csv` (previous runs are never
overwritten) and seen post URLs are persisted in `seen_urls.txt` (gitignored)
so re-crawls skip already-collected listings. The script exits non-zero if the
run yields 0 rows.

Cron (daily at 02:00, adjust the path):

```cron
0 2 * * * cd /path/to/rental-system/mogi-crawler && PAGES_LIMIT=20 ./run_crawl.sh >> crawl.log 2>&1
```

### Training the price model

`server/train.py` is the ONE authoritative training script (it supersedes the
old notebook and `price_predicting_model.py`, both deleted). It reads all
`mogi_after_parsing*.csv` plus `nhatot-crawler/data/nhatot_rentals_*.csv`,
repairs the historical lat/lon column swap, drops rows outside Vietnam bounds,
splits by district (no leakage across duplicate-heavy snapshots) and writes
`server/models/{re_model.pkl,label_encoder.pkl,model_meta.json}`.

```sh
../crawlers-venv/bin/python server/train.py
../crawlers-venv/bin/python server/test_prediction.py   # contract test
```

scikit-learn is pinned in `requirements.txt` — the pickles are a versioned
contract recorded in `model_meta.json`. The `.pkl` artifacts are gitignored
(62 MB, regenerable): a fresh clone/serving host MUST run `train.py` once
before starting gunicorn, or the service refuses to boot.

### Serving

Production (nginx fronts it, model loads once at startup):

```sh
cd server && gunicorn --bind 127.0.0.1:5000 app:app
```

CORS origins come from the `CORS_ORIGINS` env var (comma-separated, default
`http://localhost:3000` — no wildcard). Invalid input (missing fields,
out-of-range numbers, coords outside Vietnam, unseen district/ward) returns
400 with a message, never a 500.

### Posting to the rental service

`MogiPipeline` signs in to the rental API before posting listings. Supply the
account in the environment of the process that runs scrapy — the values are
never read from a committed file:

```sh
export RENTAL_API_URL=http://localhost:8100/api
export RENTAL_API_EMAIL=mogi@gmail.com
export RENTAL_API_PASSWORD=<same value as SEED_DEMO_PASSWORD>
```

Without them the crawl still runs and writes CSV, but skips the authenticated
POST and prints a warning. `RENTAL_API_PASSWORD` must match the
`SEED_DEMO_PASSWORD` used when seeding, because demo accounts store a salted
hash rather than a fixed password.
