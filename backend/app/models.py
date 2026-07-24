from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
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


# ==========================================
# 🧪 QA WORKSPACE & TEST AUTOMATION MODELS
# ==========================================

class QASuite(Base):
    __tablename__ = "qa_suites"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True, default="")
    priority = Column(String, default="Medium")
    suite_type = Column(String, default="Adhoc", nullable=True)
    jira_ticket = Column(String, default="", nullable=True)
    project_id = Column(Integer, nullable=True)
    assigned_qa = Column(String, default="Unassigned", nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to nested test cases
    test_cases = relationship("TestCase", back_populates="suite", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, index=True)  # e.g., 'tc-a1b2c3d4'
    suite_id = Column(Integer, ForeignKey("qa_suites.id"), nullable=False)
    test_case_id = Column(String, nullable=False)     # e.g., 'TC-001' or 'AUTH-001'
    description = Column(String, nullable=False)
    preconditions = Column(String, nullable=True)
    expected_result = Column(String, nullable=False)
    status = Column(String, default="Pending")         # 'Passed' | 'Failed' | 'Pending' | 'On Hold'
    attachments = Column(JSON, default=[])             # Stores attachment metadata objects

    suite = relationship("QASuite", back_populates="test_cases")


class TestPlan(Base):
    __tablename__ = "test_plans"

    id = Column(String, primary_key=True, index=True)  # e.g., 'plan-a1b2c3d4'
    plan_id = Column(String, unique=True, index=True)  # e.g., 'TP-001'
    title = Column(String, nullable=False)
    environment = Column(String, nullable=False)       # 'Staging' | 'UAT' | 'Production'
    target_release = Column(String, nullable=False)
    linked_suites = Column(JSON, default=[])          # Array of suite IDs
    status = Column(String, default="In Progress")
    created_at = Column(DateTime, default=datetime.utcnow)
    archived_at = Column(DateTime, nullable=True)


class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(String, primary_key=True, index=True)  # e.g., 'run-a1b2c3d4'
    run_id = Column(String, unique=True, index=True)   # e.g., 'ROBOT-001'
    suite_id = Column(Integer, nullable=True)
    suite_title = Column(String, nullable=False)
    plan_id = Column(String, nullable=True)
    runner_type = Column(String, default="Robot Framework")  # 'Manual' | 'Robot Framework'
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    status = Column(String, default="Passed")
    execution_logs = Column(String, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)