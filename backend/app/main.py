from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
from pydantic import BaseModel

# Safe password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from .database import engine, Base, get_db
from . import models, schemas

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Paramount Docs - QA BA Collaboration API")

# 1. Broad Cors Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Set to False when using allow_origins=["*"] to prevent browser preflight rejects
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Global Exception Catch-All to guarantee CORS headers on ANY error
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    if request.method == "OPTIONS":
        response = JSONResponse(status_code=200, content={"message": "OK"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    try:
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
    except Exception as exc:
        print(f"Server Exception: {exc}")
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(exc)}"}
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

class LoginRequest(BaseModel):
    email: str
    password: str


@app.on_event("startup")
def setup_default_roles():
    try:
        db = next(get_db())
        default_roles = [
            {
                "name": "Admin", "is_active": True,
                "project_create": True, "project_read": True, "project_update": True, "project_delete": True,
                "qa_suite_create": True, "qa_suite_read": True, "qa_suite_update": True, "qa_suite_delete": True
            },
            {
                "name": "Business Analyst", "is_active": True,
                "project_create": True, "project_read": True, "project_update": True, "project_delete": False,
                "qa_suite_create": False, "qa_suite_read": True, "qa_suite_update": False, "qa_suite_delete": False
            },
            {
                "name": "QA Engineer", "is_active": True,
                "project_create": False, "project_read": True, "project_update": False, "project_delete": False,
                "qa_suite_create": True, "qa_suite_read": True, "qa_suite_update": True, "qa_suite_delete": False
            },
        ]
        for r_data in default_roles:
            existing = db.query(models.Role).filter(models.Role.name == r_data["name"]).first()
            if not existing:
                db.add(models.Role(**r_data))
        db.commit()

        # Seed Default Admins
        admin_role = db.query(models.Role).filter(models.Role.name == "Admin").first()
        admin_emails = ["admin@paramount.com", "admin@paramount.com.ph"]
        hashed_pwd = pwd_context.hash("admin123")

        for email_addr in admin_emails:
            existing_user = db.query(models.User).filter(models.User.email == email_addr).first()
            if not existing_user:
                db.add(models.User(
                    first_name="Admin",
                    last_name="System",
                    email=email_addr,
                    hashed_password=hashed_pwd,
                    is_active=True,
                    role_name="Admin",
                    role_id=admin_role.id if admin_role else None
                ))
            else:
                existing_user.hashed_password = hashed_pwd

        db.commit()
        db.close()
    except Exception as e:
        print(f"Startup error ignored: {e}")


# =====================================================================
# 🔐 FAILSAFE AUTHENTICATION ENDPOINT
# =====================================================================

@app.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    try:
        clean_email = credentials.email.strip().lower()
        user = db.query(models.User).filter(models.User.email.ilike(clean_email)).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password."
            )

        # Check plain password or hashed
        is_valid = False
        try:
            is_valid = pwd_context.verify(credentials.password, user.hashed_password)
        except Exception:
            if user.hashed_password == credentials.password:
                is_valid = True
                user.hashed_password = pwd_context.hash(credentials.password)
                db.commit()

        if not is_valid and user.hashed_password == credentials.password:
            is_valid = True
            user.hashed_password = pwd_context.hash(credentials.password)
            db.commit()

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is deactivated."
            )

        role = db.query(models.Role).filter(models.Role.name == user.role_name).first()

        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role_name": user.role_name,
            "permissions": {
                "project_create": role.project_create if role else False,
                "project_read": role.project_read if role else True,
                "project_update": role.project_update if role else False,
                "project_delete": role.project_delete if role else False,
                "qa_suite_create": role.qa_suite_create if role else False,
                "qa_suite_read": role.qa_suite_read if role else True,
                "qa_suite_update": role.qa_suite_update if role else False,
                "qa_suite_delete": role.qa_suite_delete if role else False,
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication server error: {str(e)}"
        )


# =====================================================================
# 🔑 ROLE ENDPOINTS
# =====================================================================

@app.get("/roles", response_model=List[schemas.Role])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@app.post("/roles", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
def create_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Role).filter(models.Role.name == role.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    new_role = models.Role(**role.dict())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@app.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(role_id: int, updated_role: schemas.RoleCreate, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    for key, value in updated_role.dict().items():
        setattr(role, key, value)
    
    db.commit()
    db.refresh(role)
    return role

@app.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.name in ["Admin", "Business Analyst", "QA Engineer"]:
        raise HTTPException(status_code=400, detail="System Default roles cannot be deleted!")
        
    db.delete(role)
    db.commit()
    return {"message": f"Successfully deleted role: {role.name}"}


# =====================================================================
# 👤 USER ENDPOINTS
# =====================================================================

@app.get("/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.post("/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    role = db.query(models.Role).filter(models.Role.name == user.role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{user.role_name}' does not exist.")
        
    hashed_pwd = pwd_context.hash(user.password)
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_pwd,
        is_active=user.is_active,
        role_name=user.role_name,
        role_id=role.id
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
    if role:
        user.role_id = role.id

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
# 💬 NOTES ENDPOINTS
# =====================================================================

@app.get("/notes", response_model=List[schemas.QuickNote])
def get_notes(db: Session = Depends(get_db)):
    return db.query(models.QuickNote).order_by(models.QuickNote.id.desc()).all()

@app.post("/notes", response_model=schemas.QuickNote, status_code=status.HTTP_201_CREATED)
def create_note(note: schemas.QuickNoteCreate, db: Session = Depends(get_db)):
    new_note = models.QuickNote(author=note.author, text=note.text, timestamp=note.timestamp)
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


# =====================================================================
# 🧪 QA SUITE ENDPOINTS
# =====================================================================

@app.get("/qa-suites")
def get_qa_suites(db: Session = Depends(get_db)):
    try:
        return db.query(models.QASuite).order_by(models.QASuite.id.desc()).all()
    except Exception as e:
        print(f"Error fetching QA suites: {e}")
        return []

@app.post("/qa-suites", status_code=status.HTTP_201_CREATED)
def create_qa_suite(payload: dict, db: Session = Depends(get_db)):
    try:
        new_suite = models.QASuite(
            title=payload.get("title"),
            description=payload.get("description", ""),
            priority=payload.get("priority", "Medium"),
            suite_type=payload.get("suite_type", "Adhoc"),
            jira_ticket=payload.get("jira_ticket", ""),
            project_id=payload.get("project_id")
        )
        db.add(new_suite)
        db.commit()
        db.refresh(new_suite)
        return new_suite
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create test suite: {str(e)}")