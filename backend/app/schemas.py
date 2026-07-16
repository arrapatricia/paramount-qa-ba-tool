from pydantic import BaseModel, EmailStr
from typing import Optional, List

# ==========================================
# 🔑 ROLE SCHEMAS
# ==========================================
class RoleBase(BaseModel):
    name: str
    can_create_project: bool = False
    can_edit_all_projects: bool = False

class RoleCreate(RoleBase):
    pass  # Used when creating a new role from the frontend

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
    email: EmailStr
    is_active: bool = True
    role_name: str

class UserCreate(UserBase):
    password: str  # <-- ADD THIS LINE (frontend sends this during registration)

class User(UserBase):
    id: int
    role_id: Optional[int] = None

    class Config:
        from_attributes = True

# Schemas for a password reset request
class UserPasswordReset(BaseModel):
    new_password: str


# ==========================================
# 💬 QUICK NOTE SCHEMAS
# ==========================================
class QuickNoteBase(BaseModel):
    author: str
    text: str
    timestamp: str

class QuickNoteCreate(QuickNoteBase):
    pass  # Used when posting a new sticky note

class QuickNote(QuickNoteBase):
    id: int

    class Config:
        from_attributes = True