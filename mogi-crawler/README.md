### Install Python

I assume that you had installed Python on your computer. For installation process, please checkout https://www.python.org/downloads/

### How to use it
Run the commands: (you can change the pages_limit to the number of pages you want to scrape)

```sh
scrapy crawl mogi_spider -o mogi_rentals_data.csv -a pages_limit=3868
```

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
