from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    """Base product schema."""
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, description="Price in AZN")
    compare_at_price: Optional[Decimal] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = Field(default_factory=list)


class ProductCreate(ProductBase):
    """Schema for creating a product."""
    inventory_count: int = Field(default=0, ge=0)
    track_inventory: bool = True
    allow_backorder: bool = False
    low_stock_threshold: int = Field(default=5, ge=0)
    images: Optional[List[str]] = Field(default_factory=list)
    
    @model_validator(mode='after')
    def compare_price_higher(self):
        """Ensure compare_at_price is higher than price."""
        if self.compare_at_price is not None and self.compare_at_price <= self.price:
            raise ValueError('compare_at_price must be higher than price')
        return self


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    compare_at_price: Optional[Decimal] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    inventory_count: Optional[int] = Field(None, ge=0)
    track_inventory: Optional[bool] = None
    allow_backorder: Optional[bool] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    images: Optional[List[str]] = None


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: int
    slug: str
    inventory_count: int
    track_inventory: bool
    allow_backorder: bool
    low_stock_threshold: int
    is_active: bool
    is_featured: bool
    images: List[str]
    shop_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Computed properties
    is_in_stock: bool
    is_low_stock: bool
    
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """Paginated product list response."""
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int