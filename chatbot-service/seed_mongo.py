import json
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import BulkWriteError, ConnectionFailure

# Load environment variables
load_dotenv()

def seed_data():
    print("Starting data seeding process...")
    
    # MongoDB connection settings
    MONGODB_URI = f"mongodb://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@localhost:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}?authSource=admin"
    print(f"Connecting to MongoDB at localhost:{os.getenv('DB_PORT')}...")
    
    try:
        # Connect to MongoDB with timeout
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.server_info()
        print("Successfully connected to MongoDB")
        
        db = client[os.getenv('DB_NAME')]
        
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
        
        # Create collections
        rentals_collection = db['rentals']
        images_collection = db['images']
        
        # Clear existing data
        print("Clearing existing data...")
        rentals_collection.delete_many({})
        images_collection.delete_many({})
        
        print("Processing posts...")
        for i, post in enumerate(posts, 1):
            if i % 10 == 0:
                print(f"Processing post {i}/{len(posts)}")
                
            # Extract images and remove from post
            images = post.pop('images', [])
            
            # Insert rental
            try:
                result = rentals_collection.insert_one(post)
                print(f"Inserted rental with ID: {result.inserted_id}")
                
                # Insert related images
                if images:
                    # Add rental_id to each image
                    for image in images:
                        image['rental_id'] = result.inserted_id
                    
                    image_result = images_collection.insert_many(images)
                    print(f"Inserted {len(image_result.inserted_ids)} images for rental {result.inserted_id}")
                
            except Exception as e:
                print(f"Error inserting rental {post.get('id')}: {str(e)}")
                continue
                
        print("\nSeeding process completed!")
                
    except ConnectionFailure as e:
        print(f"Failed to connect to MongoDB: {str(e)}")
        print("Please check if MongoDB is running and the connection details are correct")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()
            print("MongoDB connection closed")

if __name__ == "__main__":
    seed_data() 