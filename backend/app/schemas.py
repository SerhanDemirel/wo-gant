from pydantic import BaseModel, Field, ConfigDict
from typing import List
from datetime import datetime

class OperationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    workOrderId: str = Field(serialization_alias="workOrderId")
    index: int
    machineId: str = Field(serialization_alias="machineId")
    name: str
    start: datetime
    end: datetime

class WorkOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product: str
    qty: int
    operations: List[OperationOut]

class OperationUpdate(BaseModel):
    start: datetime
    end: datetime
