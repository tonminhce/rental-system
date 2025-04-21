## Các API Endpoint

### 1. Lấy danh sách các post theo category, area, sorting type, v.v.
https://gateway.chotot.com/v1/public/ad-listing

```CMD
curl "https://gateway.chotot.com/v1/public/ad-listing?cg=1020&limit=20&o=0&st=s&page=1&region_v2=13000" -H "User-Agent: Mozilla/5.0" -H "Accept: application/json"
```
#### Query Parameters

| Parameter     | Type   | Description |
|---------------|--------|-------------|
| `cg`          | string | Category ID (e.g. `1020` = thue-phong-tro/thue-nha-dat, `1010` = thue-can-ho-chung-cu, `1040` = thue-dat, `1030` = thue-van-phong-mat-bang-kinh-doanh) |
| `limit`       | int    | Number of listings per request (max: 50) |
| `o`           | int    | Offset (start index), calculated as `(page - 1) * limit` |
| `st`          | string | Sort type: `s` = newest, `d` = cheapest, etc. |
| `page`        | int    | Page number (starts from 1) |
| `region_v2`   | string | Region code (e.g. `13000` = HCM, `12000` = Hanoi, `3017` = Danang, `5027` = Cantho) |


### 2. Query chi tiết post qua URL (dạng .htm)
https://gateway.chotot.com/v2/public/deeplink-resolver?siteId=3&url={post_url}

```CMD
curl "https://gateway.chotot.com/v2/public/deeplink-resolver?siteId=3&url=%2Fmua-ban-nha-dat-quan-binh-tan-tp-ho-chi-minh%2F124234964.htm%23px%3DSR-stickyad-%5BPO-2%5D%5BPL-top%5D" -H "User-Agent: Mozilla/5.0" -H "Accept: application/json"
```

### 3. Query chi tiết post qua list_id
https://gateway.chotot.com/v1/public/ad-listing/{post_id}

```CMD
curl "https://gateway.chotot.com/v1/public/ad-listing/124234964" -H "User-Agent: Mozilla/5.0" -H "Accept: application/json"
```

## How to run
```Python
python nhatot_crawl.py
```