from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    can_create_project = Column(Boolean, default=False)
    can_edit_all_projects = Column(Boolean, default=False)

    # Relationship to link users assigned to this role
    users = relationship("User", back_populates="role_rel")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)  # <-- ADD THIS LINE
    is_active = Column(Boolean, default=True)
    
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role_name = Column(String, nullable=False)

    role_rel = relationship("Role", back_populates="users")

class QuickNote(Base):
    __tablename__ = "quick_notes"

    id = Column(Integer, primary_key=True, index=True)
    author = Column(String, default="Boss", nullable=False)
    text = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)