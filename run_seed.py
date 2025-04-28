import os
import sys

# Add the project root to the Python path
project_root = os.path.abspath(os.path.dirname(__file__))
sys.path.append(project_root)

# Import and run the seed function
from chatbot_backend.app.database.seed import init_and_seed_database

if __name__ == "__main__":
    print("Running database seed from root directory...")
    init_and_seed_database()
    print("Seed completed successfully!") 