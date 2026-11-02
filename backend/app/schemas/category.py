from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    parent_id: int | None = None  # NULL means top-level category


class CategorySubcategory(BaseModel):
    """A subcategory under a parent."""
    id: int
    name: str
    shop_id: int

    model_config = ConfigDict(from_attributes=True)


class CategoryTreeItem(BaseModel):
    """Top-level category with its children."""
    id: int
    name: str
    shop_id: int
    children: list[CategorySubcategory] = []

    model_config = ConfigDict(from_attributes=True)


class CategoryResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None = None
    shop_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryTreeResponse(BaseModel):
    """Full hierarchical category structure for storefront."""
    categories: list[CategoryTreeItem]
    # Flat list of all names (for backward compat with product.category string matching)
    all_names: list[str]
