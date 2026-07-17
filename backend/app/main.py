from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext

# Set up our secure password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from .database import engine, Base, get_db
from . import models, schemas

# 1. Temporarily drop and reconstruct tables to apply the new column structure
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Paramount Docs - QA BA Collaboration API")

# 2. Configure CORS so your React frontend can reach the backend
origins = [
    "https://frontend-sigma-topaz-54.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Startup Event: Pre-populate standard roles with new feature CRUD matrix
@app.on_event("startup")
def setup_default_roles():
    db = next(get_db())
    default_roles = [
        {
            "name": "Admin", 
            "is_active": True,
            "project_create": True, "project_read": True, "project_update": True, "project_delete": True,
            "qa_suite_create": True, "qa_suite_read": True, "qa_suite_update": True, "qa_suite_delete": True
        },
        {
            "name": "Business Analyst", 
            "is_active": True,
            "project_create": True, "project_read": True, "project_update": True, "project_delete": False,
            "qa_suite_create": False, "qa_suite_read": True, "qa_suite_update": False, "qa_suite_delete": False
        },
        {
            "name": "QA Engineer", 
            "is_active": False,
            "project_create": False, "project_read": True, "project_update": False, "project_delete": False,
            "qa_suite_create": True, "qa_suite_read": True, "qa_suite_update": True, "qa_suite_delete": False
        },
    ]
    for r_data in default_roles:
        existing = db.query(models.Role).filter(models.Role.name == r_data["name"]).first()
        if not existing:
            new_role = models.Role(
                name=r_data["name"],
                is_active=r_data["is_active"],
                project_create=r_data["project_create"],
                project_read=r_data["project_read"],
                project_update=r_data["project_update"],
                project_delete=r_data["project_delete"],
                qa_suite_create=r_data["qa_suite_create"],
                qa_suite_read=r_data["qa_suite_read"],
                qa_suite_update=r_data["qa_suite_update"],
                qa_suite_delete=r_data["qa_suite_delete"]
            )
            db.add(new_role)
    db.commit()

# =====================================================================
# 🔑 ROLE ENDPOINTS (CRUD)
# =====================================================================

@app.get("/roles", response_model=List[schemas.Role])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@app.post("/roles", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    # Check if role name already exists
    existing = db.query(models.Role).filter(models.Role.name == role.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    new_role = models.Role(
        name=role.name,
        can_create_project=role.can_create_project,
        can_edit_all_projects=role.can_edit_all_projects
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@app.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(role_id: int, updated_role: schemas.RoleCreate, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    role.name = updated_role.name
    role.can_create_project = updated_role.can_create_project
    role.can_edit_all_projects = updated_role.can_edit_all_projects
    db.commit()
    db.refresh(role)
    return role

@app.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Block deleting system roles to prevent breaking defaults
    if role.name in ["Admin", "Business Analyst", "QA Engineer"]:
        raise HTTPException(status_code=400, detail="System Default roles cannot be deleted!")
        
    db.delete(role)
    db.commit()
    return {"message": f"Successfully deleted role: {role.name}"}


# =====================================================================
# 👤 USER ENDPOINTS (CRUD)
# =====================================================================

# =====================================================================
# 👤 USER ENDPOINTS (CRUD & Security)
# =====================================================================

@app.get("/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.post("/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verify email is unique
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Try to find corresponding role ID
    role = db.query(models.Role).filter(models.Role.name == user.role_name).first()
    role_id = role.id if role else None

    # Secure the password using the pwd_context hash!
    hashed_pwd = pwd_context.hash(user.password)

    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_pwd,  # Save the hash, never the plain text
        is_active=user.is_active,
        role_name=user.role_name,
        role_id=role_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, updated_user: schemas.UserBase, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(models.Role).filter(models.Role.name == updated_user.role_name).first()
    
    user.first_name = updated_user.first_name
    user.last_name = updated_user.last_name
    user.email = updated_user.email
    user.is_active = updated_user.is_active
    user.role_name = updated_user.role_name
    user.role_id = role.id if role else None

    db.commit()
    db.refresh(user)
    return user

@app.patch("/users/{user_id}/toggle-status", response_model=schemas.User)
def toggle_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

@app.put("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, payload: schemas.UserPasswordReset, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Securely hash the new incoming password and update the database
    user.hashed_password = pwd_context.hash(payload.new_password)
    db.commit()
    return {"message": f"Password reset successfully for {user.first_name}."}

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


# =====================================================================
# 💬 PERSISTENT NOTES ENDPOINTS
# =====================================================================

@app.get("/notes", response_model=List[schemas.QuickNote])
def get_notes(db: Session = Depends(get_db)):
    return db.query(models.QuickNote).order_by(models.QuickNote.id.desc()).all()

@app.post("/notes", response_model=schemas.QuickNote, status_code=status.HTTP_201_CREATED)
def create_note(note: schemas.QuickNoteCreate, db: Session = Depends(get_db)):
    new_note = models.QuickNote(
        author=note.author,
        text=note.text,
        timestamp=note.timestamp
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.QuickNote).filter(models.QuickNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}