SPIDER_MODULES = ["website_scraper.spiders"]

ITEM_PIPELINES = {
    "website_scraper.pipelines.CSVExportPipeline": 400,
    "website_scraper.pipelines.MogiPipeline": 300,
}
