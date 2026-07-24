from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ==========================================
# 🔑 ROLE SCHEMAS
# ==========================================
class RoleBase(BaseModel):
    name: str
    is_active: bool = True
    project_create: bool = False
    project_read: bool = True
    project_update: bool = False
    project_delete: bool = False
    qa_suite_create: bool = False
    qa_suite_read: bool = True
    qa_suite_update: bool = False
    qa_suite_delete: bool = False

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# 👤 USER SCHEMAS
# ==========================================
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    is_active: bool = True
    role_name: str

class UserCreate(UserBase):
    password: str

class UserPasswordReset(BaseModel):
    new_password: str

class User(UserBase):
    id: int
    role_id: Optional[int] = None

    class Config:
        from_attributes = True


# ==========================================
# 💬 QUICK NOTES SCHEMAS
# ==========================================
class QuickNoteBase(BaseModel):
    author: str
    text: str
    timestamp: str

class QuickNoteCreate(QuickNoteBase):
    pass

class QuickNote(QuickNoteBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# 📎 ATTACHMENT SCHEMAS
# ==========================================
class AttachmentSchema(BaseModel):
    id: str
    name: str
    type: str  # 'image' | 'video'
    url: str


# ==========================================
# 📋 TEST CASE SCHEMAS
# ==========================================
class TestCaseBase(BaseModel):
    test_case_id: str
    description: str
    preconditions: Optional[str] = None
    expected_result: str
    status: str = "Pending"  # 'Passed' | 'Failed' | 'Pending' | 'On Hold'
    attachments: Optional[List[AttachmentSchema]] = []

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseUpdate(BaseModel):
    description: Optional[str] = None
    preconditions: Optional[str] = None
    expected_result: Optional[str] = None
    status: Optional[str] = None
    attachments: Optional[List[AttachmentSchema]] = None

class TestCaseResponse(TestCaseBase):
    id: str
    suite_id: int

    class Config:
        from_attributes = True


# ==========================================
# 🧪 QA SUITE SCHEMAS
# ==========================================
class QASuiteBase(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "Medium"  # 'Low' | 'Medium' | 'High' | 'Critical'
    suite_type: Optional[str] = "Adhoc"  # 'Adhoc' | 'With JIRA Ticket'
    jira_ticket: Optional[str] = ""
    project_id: Optional[int] = None
    assigned_qa: Optional[str] = "Unassigned"

class QASuiteCreate(QASuiteBase):
    pass

class QASuiteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    suite_type: Optional[str] = None
    jira_ticket: Optional[str] = None
    project_id: Optional[int] = None
    assigned_qa: Optional[str] = None

class QASuiteResponse(QASuiteBase):
    id: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    test_cases: List[TestCaseResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# 📄 TEST PLAN SCHEMAS
# ==========================================
class TestPlanBase(BaseModel):
    title: str
    environment: str  # 'Staging' | 'UAT' | 'Production'
    target_release: str
    linked_suites: List[str] = []

class TestPlanCreate(TestPlanBase):
    pass

class TestPlanUpdate(BaseModel):
    title: Optional[str] = None
    environment: Optional[str] = None
    target_release: Optional[str] = None
    linked_suites: Optional[List[str]] = None
    status: Optional[str] = None

class TestPlanResponse(TestPlanBase):
    id: str
    plan_id: str
    status: str
    created_at: datetime
    archived_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# 🤖 ROBOT FRAMEWORK & TEST RUN SCHEMAS
# ==========================================
class TestRunBase(BaseModel):
    suite_id: Optional[int] = None
    suite_title: str
    plan_id: Optional[str] = None
    runner_type: str = "Robot Framework"  # 'Manual' | 'Robot Framework'
    passed_count: int = 0
    failed_count: int = 0
    total_count: int = 0
    status: str = "Passed"  # 'Passed' | 'Failed' | 'In Progress'
    execution_logs: Optional[str] = None

class TestRunCreate(TestRunBase):
    pass

class TestRunResponse(TestRunBase):
    id: str
    run_id: str
    executed_at: datetime

    class Config:
        from_attributes = True