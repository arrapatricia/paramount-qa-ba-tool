from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

# 🔧 Fixed imports to use package paths matching app.main execution
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/qa", tags=["QA Workspace & Test Automation"])

# ==========================================
# 🧪 QA TEST SUITES
# ==========================================
@router.get("/suites", response_model=List[schemas.QASuiteResponse])
def get_all_suites(db: Session = Depends(get_db)):
    """Fetch all test suites along with their test cases."""
    try:
        suites = db.query(models.QASuiteModel).all()
        return suites
    except AttributeError:
        # Fallback if model class is named QASuite in models.py
        suites = db.query(models.QASuite).all()
        return suites


@router.post("/suites", response_model=schemas.QASuiteResponse, status_code=status.HTTP_201_CREATED)
def create_suite(payload: schemas.QASuiteCreate, db: Session = Depends(get_db)):
    """Create a new Test Suite."""
    suite_model = getattr(models, "QASuiteModel", models.QASuite)
    new_suite = suite_model(**payload.model_dump())
    db.add(new_suite)
    db.commit()
    db.refresh(new_suite)
    return new_suite


@router.get("/suites/{suite_id}", response_model=schemas.QASuiteResponse)
def get_suite_by_id(suite_id: int, db: Session = Depends(get_db)):
    """Fetch a single test suite by ID."""
    suite_model = getattr(models, "QASuiteModel", models.QASuite)
    suite = db.query(suite_model).filter(suite_model.id == suite_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    return suite


@router.put("/suites/{suite_id}", response_model=schemas.QASuiteResponse)
def update_suite_specs(suite_id: int, payload: schemas.QASuiteUpdate, db: Session = Depends(get_db)):
    """Update specifications/metadata for an existing suite."""
    suite_model = getattr(models, "QASuiteModel", models.QASuite)
    suite = db.query(suite_model).filter(suite_model.id == suite_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(suite, key, value)

    db.commit()
    db.refresh(suite)
    return suite


@router.delete("/suites/{suite_id}", status_code=status.HTTP_200_OK)
def soft_delete_suite(suite_id: int, db: Session = Depends(get_db)):
    """Soft delete a suite by setting its deleted_at timestamp."""
    suite_model = getattr(models, "QASuiteModel", models.QASuite)
    suite = db.query(suite_model).filter(suite_model.id == suite_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")
    
    suite.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Suite moved to archive trash successfully"}


@router.patch("/suites/{suite_id}/restore", status_code=status.HTTP_200_OK)
def restore_suite_from_trash(suite_id: int, db: Session = Depends(get_db)):
    """Restore a soft-deleted suite from trash."""
    suite_model = getattr(models, "QASuiteModel", models.QASuite)
    suite = db.query(suite_model).filter(suite_model.id == suite_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    suite.deleted_at = None
    db.commit()
    return {"message": "Suite restored successfully"}


# ==========================================
# 📋 TEST CASES (NESTED IN SUITE)
# ==========================================
@router.post("/suites/{suite_id}/test-cases", response_model=schemas.TestCaseResponse, status_code=status.HTTP_201_CREATED)
def add_test_case_to_suite(suite_id: int, payload: schemas.TestCaseCreate, db: Session = Depends(get_db)):
    """Add a test case to a specific suite."""
    suite_model = getattr(models, "QASuiteModel", models.QASuite)
    suite = db.query(suite_model).filter(suite_model.id == suite_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    tc_model = getattr(models, "TestCaseModel", models.TestCase)
    new_test_case = tc_model(
        id=f"tc-{uuid.uuid4().hex[:8]}",
        suite_id=suite_id,
        **payload.model_dump()
    )
    db.add(new_test_case)
    db.commit()
    db.refresh(new_test_case)
    return new_test_case


@router.put("/test-cases/{test_case_id}", response_model=schemas.TestCaseResponse)
def update_test_case(test_case_id: str, payload: schemas.TestCaseUpdate, db: Session = Depends(get_db)):
    """Update test case details or status."""
    tc_model = getattr(models, "TestCaseModel", models.TestCase)
    test_case = db.query(tc_model).filter(tc_model.id == test_case_id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(test_case, key, value)

    db.commit()
    db.refresh(test_case)
    return test_case


@router.delete("/test-cases/{test_case_id}")
def delete_test_case(test_case_id: str, db: Session = Depends(get_db)):
    """Delete a test case from a suite."""
    tc_model = getattr(models, "TestCaseModel", models.TestCase)
    test_case = db.query(tc_model).filter(tc_model.id == test_case_id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    db.delete(test_case)
    db.commit()
    return {"message": "Test case deleted successfully"}


# ==========================================
# 📄 TEST PLANS
# ==========================================
@router.get("/plans", response_model=List[schemas.TestPlanResponse])
def get_all_plans(db: Session = Depends(get_db)):
    """Fetch all release test plans."""
    plan_model = getattr(models, "TestPlanModel", models.TestPlan)
    plans = db.query(plan_model).all()
    return plans


@router.post("/plans", response_model=schemas.TestPlanResponse, status_code=status.HTTP_201_CREATED)
def create_test_plan(payload: schemas.TestPlanCreate, db: Session = Depends(get_db)):
    """Create a new release test plan."""
    plan_model = getattr(models, "TestPlanModel", models.TestPlan)
    count = db.query(plan_model).count()
    generated_plan_id = f"TP-{str(count + 1).zfill(3)}"

    new_plan = plan_model(
        id=f"plan-{uuid.uuid4().hex[:8]}",
        plan_id=generated_plan_id,
        status="In Progress",
        **payload.model_dump()
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan


# ==========================================
# 🤖 TEST RUNS (ROBOT FRAMEWORK ENDPOINT)
# ==========================================
@router.get("/runs", response_model=List[schemas.TestRunResponse])
def get_all_test_runs(db: Session = Depends(get_db)):
    """Fetch execution history for Robot Framework & manual test runs."""
    run_model = getattr(models, "TestRunModel", models.TestRun)
    runs = db.query(run_model).order_by(run_model.executed_at.desc()).all()
    return runs


@router.post("/runs", response_model=schemas.TestRunResponse, status_code=status.HTTP_201_CREATED)
def record_test_run(payload: schemas.TestRunCreate, db: Session = Depends(get_db)):
    """
    Endpoint for logging test runs.
    Accepts direct JSON payloads from Robot Framework automated test scripts or manual runs.
    """
    run_model = getattr(models, "TestRunModel", models.TestRun)
    count = db.query(run_model).count()
    prefix = "ROBOT" if payload.runner_type == "Robot Framework" else "RUN"
    generated_run_id = f"{prefix}-{str(count + 1).zfill(3)}"

    total = payload.total_count if payload.total_count > 0 else (payload.passed_count + payload.failed_count)

    new_run = run_model(
        id=f"run-{uuid.uuid4().hex[:8]}",
        run_id=generated_run_id,
        total_count=total,
        **payload.model_dump(exclude={"total_count"})
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    return new_run