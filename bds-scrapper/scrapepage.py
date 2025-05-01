import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time, os
import random, json
import threading
import concurrent.futures
from tqdm import tqdm

file_lock = threading.Lock()

def random_delay(min_seconds=1, max_seconds=3):
    """Add a random delay to make the scraping behavior more human-like"""
    delay = random.uniform(min_seconds, max_seconds)
    time.sleep(delay)

def init_driver():
    """Initialize a Chrome driver with explicit driver path for macOS"""

    chrome_user_agents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
    ]
    
    user_agent = random.choice(chrome_user_agents)
    
    options = uc.ChromeOptions()
    options.add_argument(f'--user-agent={user_agent}')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-features=IsolateOrigins,site-per-process')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-extensions')
    options.add_argument('--no-sandbox')
    options.add_argument('--headless')
    options.add_argument('--disable-dev-shm-usage')
    width = random.randint(1050, 1200)
    height = random.randint(800, 900)
    options.add_argument(f'--window-size={width},{height}')
    
    try:
        driver = uc.Chrome(version_main=135, options=options)  # Specify a version that works with your Chrome
    except Exception as e:
        print(f"First method failed: {e}")
        try:
            driver_path = ChromeDriverManager().install()
            print(f"Using Chrome driver at: {driver_path}")
            driver = uc.Chrome(driver_executable_path=driver_path, options=options)
        except Exception as e:
            print(f"Second method failed: {e}")
            try:
                from selenium import webdriver
                from selenium.webdriver.chrome.service import Service
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=options)
                print("Using regular Selenium ChromeDriver as fallback")
            except Exception as e:
                print(f"All Chrome initialization methods failed: {e}")
                raise
    
    driver.execute_script("""
        // Overwrite the 'navigator.webdriver' property
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
    """)
    
    print(f"Using Chrome with user agent: {user_agent}")
    return driver

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time
import random


def random_delay(min_seconds=1, max_seconds=3):
    """Add a random delay to make the scraping behavior more human-like"""
    delay = random.uniform(min_seconds, max_seconds)
    time.sleep(delay)

def init_driver():
    """Initialize a Chrome driver with explicit driver path for macOS"""
    chrome_user_agents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
    ]
    
    user_agent = random.choice(chrome_user_agents)
    
    options = uc.ChromeOptions()
    options.add_argument(f'--user-agent={user_agent}')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-features=IsolateOrigins,site-per-process')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-extensions')
    options.add_argument('--no-sandbox')
    options.add_argument('--headless')
    options.add_argument('--disable-dev-shm-usage')
    
    # Random window size
    width = random.randint(1050, 1200)
    height = random.randint(800, 900)
    options.add_argument(f'--window-size={width},{height}')
    
    try:
        driver = uc.Chrome(version_main=135, options=options)  
    except Exception as e:
        print(f"First method failed: {e}")
        try:
            driver_path = ChromeDriverManager().install()
            print(f"Using Chrome driver at: {driver_path}")
            driver = uc.Chrome(driver_executable_path=driver_path, options=options)
        except Exception as e:
            print(f"Second method failed: {e}")
            try:
                from selenium import webdriver
                from selenium.webdriver.chrome.service import Service
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=options)
                print("Using regular Selenium ChromeDriver as fallback")
            except Exception as e:
                print(f"All Chrome initialization methods failed: {e}")
                raise
    
    driver.execute_script("""
        // Overwrite the 'navigator.webdriver' property
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
    """)
    
    print(f"Using Chrome with user agent: {user_agent}")
    return driver

def scrape_page(urls: list[str]):
    """Scrape a single page and return the data"""
    pages_data = []
    try:
        driver = init_driver()
       
        for url in urls:
            driver.get(url)
            scroll_height = driver.execute_script("return document.body.scrollHeight")
            for i in range(1, 5):
                driver.execute_script(f"window.scrollTo(0, {scroll_height * i / 5})")
                random_delay(0, 0.5)
            # Random initial waiting time
            page_data = {
                'title': "",
                'price': "",
                'area': "",
                'bedroom': "",
                "bathroom": "",
                "floor": "",
                "date": "",
                "expire": "",
                "benefit": "",
                "frontview": "",
                "movetime": "",
                "interior": "" ,
                "address": "",
                "lattitude": "",
                "longitude": "",
                "user": "",
                "img": []
            }
            page_data["title"] = driver.find_element(By.CSS_SELECTOR, "h1[class*='re__pr-title pr-title js__pr-title']").text
            page_data["address"] = driver.find_element(By.CSS_SELECTOR, "span[class*='re__pr-short-description js__pr-address']").text
            map_url = driver.find_element(By.CSS_SELECTOR, "iframe[class*='lazyload']").get_attribute('data-src')
            lat, lng = concat_coordinate(map_url)
            page_data["lattitude"] = lat
            page_data["longitude"] = lng
            page_data["user"] = driver.find_elements(By.CSS_SELECTOR, "a[class*='re__contact-name']")[1].text
            list_main_ele =  driver.find_elements(By.CSS_SELECTOR, "div[class*='re__pr-short-info-item js__pr-short-info-item']")
            img_container = driver.find_element(By.CSS_SELECTOR, "div[class*='re__pr-media-slide js__pr-media-slide']")
            page_data["img"] = [li.find_element(By.CSS_SELECTOR, "img").get_attribute('src') for li in img_container.find_elements(By.CSS_SELECTOR, "li")]
            for main_ele in list_main_ele:
                val = main_ele.find_element(By.CSS_SELECTOR, "span[class*='value']").text
                key = main_ele.find_element(By.CSS_SELECTOR, "span[class*='title']").text 
                if "M" in key:
                    page_data["price"] = val
                elif 'P' in key:
                    page_data["bedroom"] = val
                else:
                    page_data["area"] = val

            des_path = "div[class*='re__section-body re__detail-content js__section-body js__pr-description js__tracking']"
            description = driver.find_element(By.CSS_SELECTOR, des_path).text
            page_data["description"] = description

            list_addition_info = driver.find_elements(By.CSS_SELECTOR, "div[class*='re__pr-specs-content-item']")
            for each_info in list_addition_info:
                key = each_info.find_element(By.CSS_SELECTOR, "i").get_attribute('class')
                val = each_info.find_element(By.CSS_SELECTOR, "span[class*='re__pr-specs-content-item-value']").text 
                list_dict = { 
                    "re__icon-size" : "area",
                    "re__icon-money": "price",
                    "re__icon-bedroom": "bedroom",
                    "re__icon-front-view": "frontview",
                    "re__icon-bath": "bathroom",
                    "re__icon-apartment": "floor",
                    "re__icon-benefit": "benefit",
                    "re__icon-clock": "movetime",
                    "re__icon-interior": "interior" 
                }
                if key != None:
                    k_2 = list_dict.get(key)
                    if k_2 != None:
                        page_data[k_2] = val

            dates_sec = driver.find_elements(By.CSS_SELECTOR, "div[class*='re__pr-short-info-item js__pr-config-item']")
            for date_ele in dates_sec:
                val = date_ele.find_element(By.CSS_SELECTOR, "span[class*='value']").text
                key = date_ele.find_element(By.CSS_SELECTOR, "span[class*='title']").text 
                if "N" in key:
                    if "h" in key:
                        page_data["expire"] = val
                    else:
                        page_data["date"] = val

            pages_data += [page_data]

        driver.quit()
        return pages_data
    
    except Exception as e:
        print(f"Error scraping url {url}: {str(e)}")
        try:
            driver.quit()
        except:
            pass
        return pages_data

def concat_coordinate(url: str | None):
    if url == None:
        return None
    q_index = url.find("?q=")
    if q_index != -1:
        start_pos = q_index + 3
        end_pos = url.find("&", start_pos)
        coordinates_str = url[start_pos:end_pos]
        if "," in coordinates_str:
            lat, lng = coordinates_str.split(",")
            return (lat, lng)
        else:
            print(f"Could not parse coordinates from: {coordinates_str}")
    else:
        print("No coordinates found in URL")



def process_batch(batch_urls):
    """Process a batch of URLs"""
    batch_results = []
    
    scraped_data = scrape_page(batch_urls)
    for i, data in enumerate(scraped_data):
        if i < len(batch_urls): 
            data['url'] = batch_urls[i]
            batch_results.append(data)
    
    return batch_results

"""
Scraper  11620 link
"""
def load_links(file_path):
    """Load links from CSV file"""
    df = pd.read_csv(file_path)
    return df['Link'].tolist()


def load_progress(output_file):
    """Load already processed URLs from output file"""
    if not os.path.exists(output_file):
        return [], set()
    
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        processed_urls = {item.get('url', '') for item in data if 'url' in item}
        return data, processed_urls
    except (json.JSONDecodeError, FileNotFoundError):
        print(f"Could not load progress from {output_file}, starting fresh")
        return [], set()

def save_results(new_results, output_file):
    """Save results to output JSON file with retry mechanism"""
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            with file_lock:  # Use lock to prevent concurrent writes
                # Load existing data
                if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                    try:
                        with open(output_file, 'r', encoding='utf-8') as f:
                            existing_data = json.load(f)
                    except json.JSONDecodeError:
                        print(f"Error reading JSON file. Creating new file.")
                        existing_data = []
                else:
                    existing_data = []
                
                # Append new results
                all_data = existing_data + new_results
                
                # Write back to file
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(all_data, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            print(f"Save attempt {attempt+1} failed: {e}")
            time.sleep(1)
    
    print(f"Failed to save results after {max_retries} attempts")
    return False

def process_batch(batch_urls):
    """Process a batch of URLs"""
    batch_results = []
    
    # Track URLs and their corresponding data
    scraped_data = scrape_page(batch_urls)
    
    # Add URL information to each result
    for i, data in enumerate(scraped_data):
        if i < len(batch_urls):  # Safety check
            data['url'] = batch_urls[i]
            batch_results.append(data)
    
    return batch_results


def runner(csv_path, output_file):
    batch_size = 10  # Number of links per batch
    num_workers = 4  # Number of parallel workers
    
    # Load links
    all_links = load_links(csv_path)
    print(f"Loaded {len(all_links)} links")
    
    # Load existing progress
    existing_results, processed_urls = load_progress(output_file)
    print(f"Found {len(processed_urls)} already processed links")
    
    # Filter out already processed links
    links_to_process = [link for link in all_links if link not in processed_urls]
    print(f"Processing {len(links_to_process)} remaining links")
    
    # Create batches of links
    batches = [links_to_process[i:i+batch_size] for i in range(0, len(links_to_process), batch_size)]
    print(f"Created {len(batches)} batches")
    
    # Process batches in parallel
    with concurrent.futures.ProcessPoolExecutor(max_workers=num_workers) as executor:
        # Submit all batches to the executor
        future_to_batch = {executor.submit(process_batch, batch): batch for batch in batches}
        
        # Process results as they complete with progress bar
        for future in tqdm(concurrent.futures.as_completed(future_to_batch), total=len(batches), desc="Processing batches"):
            batch = future_to_batch[future]
            try:
                # Get results for this batch
                batch_results = future.result()
                
                # Save this batch's results immediately
                if batch_results:
                    save_results(batch_results, output_file)
                    
            except Exception as e:
                print(f"Error processing batch {batch[:1]}: {e}")
    
    print(f"Crawling completed. Results saved to {output_file}")