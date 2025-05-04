import json
import os
from datetime import datetime
from dotenv import load_dotenv
from app.database.db_connection import get_db_connection

# Load environment variables
load_dotenv()

def seed_data():
    """
    Import data from JSON file into MySQL database
    """
    print("Starting data seeding process...")
    
    try:
        # Get the current script directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(current_dir, 'app', 'database', 'response.json')
        print(f"Reading data from: {json_path}")
        
        # Read response.json
        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                print("Loading JSON data...")
                data = json.load(file)
                print("JSON data loaded successfully")
        except FileNotFoundError:
            print(f"Error: response.json not found at {json_path}")
            print("Please ensure the file exists at: chatbot-backend/app/database/response.json")
            return
        except json.JSONDecodeError:
            print("Error: Invalid JSON format in response.json")
            return
        
        # Get the posts collection
        posts = data.get('data', {}).get('posts', [])
        
        if not posts:
            print("No posts found in response.json")
            return
            
        print(f"Found {len(posts)} posts to process")
        
        # Import data into MySQL
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                # Clear existing data
                print("Clearing existing data...")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                cursor.execute("TRUNCATE TABLE property_images")
                cursor.execute("TRUNCATE TABLE properties")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
                
                print("Processing posts...")
                for i, post in enumerate(posts, 1):
                    if i % 10 == 0:
                        print(f"Processing post {i}/{len(posts)}")
                    
                    # Extract images
                    images = post.pop('images', [])
                    
                    # Insert property
                    cursor.execute("""
                        INSERT INTO properties (
                            id, name, description, price, area,
                            property_type, transaction_type, source_url,
                            province, district, ward, street,
                            latitude, longitude, displayed_address,
                            status, bedrooms, bathrooms,
                            contact_name, contact_phone, post_url,
                            created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s,
                            %s, %s
                        )
                    """, (
                        post.get('id'),
                        post.get('name'),
                        post.get('description'),
                        post.get('price'),
                        post.get('area'),
                        post.get('propertyType'),
                        post.get('transactionType'),
                        post.get('sourceUrl'),
                        post.get('province'),
                        post.get('district'),
                        post.get('ward'),
                        post.get('street'),
                        post.get('latitude'),
                        post.get('longitude'),
                        post.get('displayedAddress'),
                        post.get('status'),
                        post.get('bedrooms'),
                        post.get('bathrooms'),
                        post.get('contactName'),
                        post.get('contactPhone'),
                        post.get('postUrl'),
                        datetime.strptime(post.get('createdAt'), '%Y-%m-%dT%H:%M:%S.%fZ'),
                        datetime.strptime(post.get('updatedAt'), '%Y-%m-%dT%H:%M:%S.%fZ')
                    ))
                    
                    # Insert images if any
                    if images:
                        for image in images:
                            cursor.execute("""
                                INSERT INTO property_images (
                                    property_id, url,
                                    created_at, updated_at
                                ) VALUES (
                                    %s, %s, %s, %s
                                )
                            """, (
                                post.get('id'),
                                image.get('url'),
                                datetime.now(),
                                datetime.now()
                            ))
            conn.commit()
            
        print("Data seeded successfully!")
    except Exception as e:
        print(f"Error seeding data: {str(e)}")

if __name__ == "__main__":
    seed_data() 