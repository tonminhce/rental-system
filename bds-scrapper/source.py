import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from concurrent.futures import ThreadPoolExecutor
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
import time
import random
import os
from tqdm import tqdm

def random_delay(min_seconds=1, max_seconds=3):
    """Add a random delay to make the scraping behavior more human-like"""
    delay = random.uniform(min_seconds, max_seconds)
    time.sleep(delay)

def get_user_agent():
    """Return a random user agent"""
    user_agents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/99.0.1150.36',
    ]
    return random.choice(user_agents)

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

def scrape_page(page_num):
    """Scrape a single page and return the data"""
    try:
        driver = init_driver()
        page_data = []
        url = f"https://batdongsan.com.vn/cho-thue-nha-tro-phong-tro-tp-hcm/p{page_num}?cIds=326"
        driver.get(url)
        
        random_delay(2, 5)
        
        scroll_height = driver.execute_script("return document.body.scrollHeight")
        for i in range(1, 5):
            driver.execute_script(f"window.scrollTo(0, {scroll_height * i / 5})")
            random_delay(0.5, 1.5)
        
        posts = driver.find_elements(By.CSS_SELECTOR, "div[class*='js__card js__card-full-web']")
        
        for post in posts:
            random_delay(0.2, 0.7)
            try:
                title = post.find_element(By.CSS_SELECTOR, "span[class*='pr-title js__card-title']").text
            except:
                title = None
                
            try:
                price = post.find_element(By.CSS_SELECTOR, "span[class*='re__card-config-price js__card-config-item']").text
            except:
                price = None
                
            try:
                area = post.find_element(By.CSS_SELECTOR, "span[class*='re__card-config-area js__card-config-item']").text
            except:
                area = None
                
            try:
                location = post.find_element(By.CSS_SELECTOR, "div[class*='re__card-location']").text
            except:
                location = None
                
            try:
                link = post.find_element(By.CSS_SELECTOR, "a[class*='js__product-link-for-product-id']").get_attribute('href')
            except:
                link = None
                
            page_data.append({
                "Tiêu đề": title,
                "Giá": price,
                "Diện tích": area,
                "Địa điểm": location,
                "Link": link,
                "Page": page_num
            })
        
        driver.quit()
        return page_data
    
    except Exception as e:
        print(f"Error scraping page {page_num}: {str(e)}")
        try:
            driver.quit()
        except:
            pass
        return []

def scrape_with_threading(start_page=1, end_page=600, max_workers=4):
    """Scrape multiple pages in parallel using ThreadPoolExecutor"""
    pages_to_scrape = list(range(start_page, end_page + 1))
    all_data = []
    
    os.makedirs("checkpoints", exist_ok=True)
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(tqdm(executor.map(scrape_page, pages_to_scrape), total=len(pages_to_scrape)))
        for page_data in results:
            all_data.extend(page_data)

            if len(all_data) > 0 and len(all_data) % 100 == 0:
                checkpoint_df = pd.DataFrame(all_data)
                checkpoint_df.to_csv(f"checkpoints/phong_tro_checkpoint_{len(all_data)}.csv", index=False, encoding='utf-8-sig')
    
    return all_data
