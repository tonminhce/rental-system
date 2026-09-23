import os

import scrapy
from scrapy.http import Response

from website_scraper.items import PostItem

# Cross-run dedup state: one URL per line, gitignored.
# ponytail: flat text file; sqlite when it grows past ~1M URLs.
SEEN_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "seen_urls.txt",
)


class MogiSpider(scrapy.Spider):
    name = "mogi_spider"

    def __init__(self, category=None, pages_limit=20, *args, **kwargs):
        super(MogiSpider, self).__init__(*args, **kwargs)
        self.page_count = 1
        self.pages_limit = int(pages_limit)  # was AttributeError on a bare run
        self.start_urls = [
            "https://mogi.vn/ho-chi-minh/thue-phong-tro-nha-tro?cp=1",
            "https://mogi.vn/thue-nha-dat?tp=10&fbr=1&tbr=1",
            "https://mogi.vn/thue-nha-dat?tp=10&fbr=2&tbr=2",
            "https://mogi.vn/thue-nha-dat?tp=20&fbr=3&tbr=3",
            "https://mogi.vn/thue-nha-dat?tp=20&fbr=4&tbr=4",
            "https://mogi.vn/thue-phong-tro-khu-nha-tro?tp=20&fbr=1&tbr=1",
        ]
        try:
            with open(SEEN_FILE, encoding="utf-8") as f:
                self.seen_urls = set(line.strip() for line in f if line.strip())
        except FileNotFoundError:
            self.seen_urls = set()
        self.new_urls = 0
        self.logger.info("Loaded %d seen URLs from %s", len(self.seen_urls), SEEN_FILE)

    def closed(self, reason):
        with open(SEEN_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(sorted(self.seen_urls)))
        self.logger.info("Dedup state: %d URLs saved (%d new this run)", len(self.seen_urls), self.new_urls)

    def parse(self, response: Response):
        self.logger.info("Scraping page %d/%d", self.page_count, self.pages_limit)
        posts = response.css("ul.props > *")

        for post in posts:
            post_url = post.css("a.link-overlay::attr(href)").get()
            if not post_url or post_url in self.seen_urls:
                continue
            self.seen_urls.add(post_url)
            self.new_urls += 1
            yield response.follow(
                post_url, self.parse_post_detail, meta={"post_url": post_url}
            )

        if self.page_count < self.pages_limit:
            next_page = response.css("ul.pagination>li:last-child>a::attr(href)").get()
            if next_page:
                self.page_count += 1
                yield response.follow(next_page, self.parse)

    def parse_post_detail(self, response: Response):
        title = response.css(".title > h1::text").get()
        address = response.css(".address::text").get()
        price = response.css("div.price::text").get()
        description = response.css(".info-content-body").xpath("string()").get()
        post_url = response.meta.get("post_url")
        optional_properties = response.css("div.info-attrs.clearfix > *")

        owner_name = response.css(".agent-info img::attr(alt)").get()
        owner_contact = response.css(".agent-contact a::attr(ng-bind)").get()

        images = response.css(".media-item img::attr(data-src)").getall()
        thumbnail = images[0] if images else None

        # Geocode comes from the embedded map iframe (?q=lat,lon). Missing or
        # malformed links used to crash the callback (None.split); skip instead.
        google_map_link = response.css("iframe::attr(data-src)").get()
        try:
            lat_s, lon_s = (google_map_link or "").split("q=")[1].split(",")[:2]
            coordinates = [float(lat_s), float(lon_s)]  # [lat, lon] — NOT GeoJSON order
        except (IndexError, ValueError):
            self.logger.warning("No usable geocode on %s — skipping item", response.url)
            return

        bedrooms = 0
        bathrooms = 0
        area = ""
        for prop in optional_properties:
            prop_name = prop.css("span:nth-of-type(1)::text").get()
            prop_value = prop.css("span:nth-of-type(2)::text").get()

            if prop_name == "Diện tích sử dụng":
                area = prop_value
            elif prop_name == "Phòng ngủ":
                bedrooms = self._to_int(prop_value)
            elif prop_name == "Nhà tắm":
                bathrooms = self._to_int(prop_value)

        yield PostItem(
            title,
            address,
            description,
            price,
            post_url,
            owner_name,
            owner_contact,
            thumbnail,
            images,
            area,
            bedrooms,
            bathrooms,
            coordinates=coordinates,
        )

    @staticmethod
    def _to_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0
