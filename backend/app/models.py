from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)

    # 1. Project Feature Permissions
    project_create = Column(Boolean, default=False)
    project_read = Column(Boolean, default=False)
    project_update = Column(Boolean, default=False)
    project_delete = Column(Boolean, default=False)

    # 2. QA Test Suite Feature Permissions
    qa_suite_create = Column(Boolean, default=False)
    qa_suite_read = Column(Boolean, default=False)
    qa_suite_update = Column(Boolean, default=False)
    qa_suite_delete = Column(Boolean, default=False)

    # Missing back-reference to user model relationship
    users = relationship("User", back_populates="role_rel")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
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