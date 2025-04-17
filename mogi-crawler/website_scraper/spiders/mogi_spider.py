import scrapy
from scrapy.http import Response
from website_scraper.items import PostItem


class MogiSpider(scrapy.Spider):
    name = "mogi_spider"
    def __init__(self, category=None, *args, **kwargs):
        super(MogiSpider, self).__init__(*args, **kwargs)
        self.page_count = 1
        self.start_urls = [
            "https://mogi.vn/ho-chi-minh/thue-phong-tro-nha-tro?cp=1",
            "https://mogi.vn/thue-nha-dat?tp=10&fbr=1&tbr=1",
            "https://mogi.vn/thue-nha-dat?tp=10&fbr=2&tbr=2",
            "https://mogi.vn/thue-nha-dat?tp=20&fbr=3&tbr=3",
            "https://mogi.vn/thue-nha-dat?tp=20&fbr=4&tbr=4",
            "https://mogi.vn/thue-phong-tro-khu-nha-tro?tp=20&fbr=1&tbr=1",
        ]

    def parse(self, response: Response):
        print(f"Scraping page {self.page_count}")
        posts = response.css("ul.props > *")

        for post in posts:
            post_url = post.css("a.link-overlay::attr(href)").get()

            yield response.follow(
                post_url, self.parse_post_detail, meta={"post_url": post_url}
            )

        print(f"pages_limit: {self.pages_limit}")
        if self.page_count < int(self.pages_limit):
            # if self.page_count < 30:
            print(f"Page {self.page_count} done")
            next_page = response.css("ul.pagination>li:last-child>a::attr(href)").get()
            if next_page:
                print(f"Next page: {next_page}")
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

        google_map_link = response.css("iframe::attr(data-src)").get()
        (lat, lon) = google_map_link.split("q=")[1].split(",")

        bedrooms = 0
        bathrooms = 0
        area = ""
        for prop in optional_properties:
            prop_name = prop.css("span:nth-of-type(1)::text").get()
            prop_value = prop.css("span:nth-of-type(2)::text").get()

            if prop_name == "Diện tích sử dụng":
                area = prop_value
            elif prop_name == "Phòng ngủ":
                bedrooms = int(prop_value)
            elif prop_name == "Nhà tắm":
                bathrooms = int(prop_value)

        print("BEDROOMS", bedrooms)
        print("BATHROOMS", bathrooms)

        item = PostItem(
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
            coordinates=[float(lon), float(lat)],
        )

        yield item
