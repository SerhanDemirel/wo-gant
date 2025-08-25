from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import joinedload
from sqlalchemy import and_
from datetime import datetime, timezone
import os

from .database import SessionLocal, engine, Base
from .models import WorkOrder, Operation
from .schemas import WorkOrderOut, OperationOut, OperationUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WO Gantt API", version="1.0.0")

allowed = [s.strip() for s in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if s.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/work-orders", response_model=list[WorkOrderOut])
def get_work_orders():
    with SessionLocal() as db:
        wos = (
            db.query(WorkOrder)
            .options(joinedload(WorkOrder.operations))
            .order_by(WorkOrder.id.asc())
            .all()
        )
        result = []
        for wo in wos:
            ops = []
            for op in sorted(wo.operations, key=lambda o: o.index):
                ops.append({
                    "id": op.id,
                    "workOrderId": op.work_order_id,
                    "index": op.index,
                    "machineId": op.machine_id,
                    "name": op.name,
                    "start": op.start,
                    "end": op.end,
                })
            result.append({
                "id": wo.id,
                "product": wo.product,
                "qty": wo.qty,
                "operations": ops
            })
        return result

def _check_rules(db, op: Operation, new_start: datetime, new_end: datetime):
    # Zorunlu: timezone içeren ISO tarih ve UTC
    if new_start.tzinfo is None:
        raise HTTPException(status_code=400, detail="start timezone bilgisi (UTC) içermeli.")
    if new_end.tzinfo is None:
        raise HTTPException(status_code=400, detail="end timezone bilgisi (UTC) içermeli.")
    new_start = new_start.astimezone(timezone.utc)
    new_end = new_end.astimezone(timezone.utc)

    if not new_end > new_start:
        raise HTTPException(status_code=400, detail="end, start'tan büyük olmalı.")

    # R3 — Geçmişe tarih yok
    now_utc = datetime.now(timezone.utc)
    if new_start < now_utc:
        raise HTTPException(status_code=400, detail="R3 ihlali: start 'now'dan önce olamaz.")

    # R1 — Aynı WO içinde ardışıklık
    if op.index and op.index > 1:
        prev = (
            db.query(Operation)
            .filter(Operation.work_order_id == op.work_order_id, Operation.index == op.index - 1)
            .first()
        )
        if prev and new_start < prev.end:
            raise HTTPException(
                status_code=400,
                detail=f"R1 ihlali: index {op.index} başlangıcı, önceki (index {op.index-1}) bitişinden önce olamaz ({prev.end.isoformat()}).",
            )

    # R2 — Aynı makinede çakışma yok
    overlapping = (
        db.query(Operation)
        .filter(
            Operation.machine_id == op.machine_id,
            Operation.id != op.id,
            and_(new_start < Operation.end, new_end > Operation.start),
        )
        .all()
    )
    if overlapping:
        ids = [oo.id for oo in overlapping]
        raise HTTPException(
            status_code=400,
            detail=f"R2 ihlali: '{op.machine_id}' makinesinde {ids} ile çakışma.",
        )

@app.patch("/api/operations/{operation_id}", response_model=OperationOut)
def update_operation(operation_id: str, payload: OperationUpdate):
    with SessionLocal() as db:
        op = db.get(Operation, operation_id)
        if not op:
            raise HTTPException(status_code=404, detail="Operation bulunamadı.")

        _check_rules(db, op, payload.start, payload.end)

        op.start = payload.start
        op.end = payload.end
        db.add(op)
        db.commit()
        db.refresh(op)

        return {
            "id": op.id,
            "workOrderId": op.work_order_id,
            "index": op.index,
            "machineId": op.machine_id,
            "name": op.name,
            "start": op.start,
            "end": op.end,
        }
