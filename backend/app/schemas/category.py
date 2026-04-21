from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str
    shop_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
