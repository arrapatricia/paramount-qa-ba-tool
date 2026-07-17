import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Fallback to local SQLite if no live DATABASE_URL environment variable is provided
# We also use getenv("DATABASE_URL") so we don't have to hardcode passwords in our codebase!
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qaba_platform.db")

# 2. Set up the engine based on whether it is Postgres or SQLite
if DATABASE_URL.startswith("sqlite"):
    # (connect_args is only needed for SQLite to handle multi-threading safely)
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # If Railway gave you a 'postgres://' connection string, SQLAlchemy requires 'postgresql://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(DATABASE_URL)

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