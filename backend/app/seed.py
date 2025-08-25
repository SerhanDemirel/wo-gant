import json
from pathlib import Path
from datetime import datetime, timezone
from .database import engine, SessionLocal, Base
from .models import WorkOrder, Operation

SEED_PATH = Path(__file__).parent.parent / "seeds" / "seed.json"

def ensure_tables():
    Base.metadata.create_all(bind=engine)

def main():
    ensure_tables()
    with SEED_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    with SessionLocal() as db:
        for wo in data:
            wo_obj = db.get(WorkOrder, wo["id"]) or WorkOrder(id=wo["id"], product=wo["product"], qty=wo["qty"])
            wo_obj.product = wo["product"]
            wo_obj.qty = wo["qty"]
            db.add(wo_obj)
            db.flush()

            existing_ops = {o.id: o for o in wo_obj.operations}
            seed_ids = {op["id"] for op in wo.get("operations", [])}
            # olmayanları sil
            for op_id in set(existing_ops.keys()) - seed_ids:
                db.delete(existing_ops[op_id])

            for op in wo.get("operations", []):
                start = datetime.fromisoformat(op["start"].replace("Z", "+00:00")).astimezone(timezone.utc)
                end = datetime.fromisoformat(op["end"].replace("Z", "+00:00")).astimezone(timezone.utc)
                op_obj = db.get(Operation, op["id"]) or Operation(id=op["id"])
                op_obj.work_order_id = op["workOrderId"]
                op_obj.index = op["index"]
                op_obj.machine_id = op["machineId"]
                op_obj.name = op["name"]
                op_obj.start = start
                op_obj.end = end
                db.add(op_obj)

        db.commit()
        print("Seed tamam.")

if __name__ == "__main__":
    main()
