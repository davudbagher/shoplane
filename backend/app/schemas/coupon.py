from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    discount_type: str = Field(..., description="'percentage' or 'fixed_amount'")
    discount_value: Decimal = Field(..., gt=0)
    scope: str = Field(default="all_products", description="'all_products' or 'specific_products'")
    applicable_product_ids: Optional[List[int]] = Field(default_factory=list)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    usage_limit: Optional[int] = Field(None, ge=1)

class CouponCreate(CouponBase):
    @model_validator(mode='after')
    def validate_discount(self):
        if self.discount_type == 'percentage' and self.discount_value > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return self

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    scope: Optional[str] = None
    applicable_product_ids: Optional[List[int]] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: int
    usage_count: int
    is_active: bool
    shop_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
