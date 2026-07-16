from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Define where our SQLite database file will live on your computer
SQLALCHEMY_DATABASE_URL = "sqlite:///./qaba_platform.db"

# 2. Create the database engine
# (connect_args is only needed for SQLite to handle multi-threading safely)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Create a Session local class (each instance will be a database session)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create a Base class that our future models (tables) will inherit from
Base = declarative_base()

# Helper function to open/close database connections automatically per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()