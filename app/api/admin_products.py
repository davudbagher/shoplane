from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from math import ceil
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.utils.dependencies import get_current_user, verify_shop_owner

router = APIRouter(prefix="/admin/products", tags=["Admin - Products"])


@router.post("/{shop_id}/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    shop_id: int,
    product_data: ProductCreate,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Create a new product in shop inventory.
    
    Azerbaijan sellers can now add products with:
    - Name & description (in Azerbaijani or Russian)
    - Price in AZN (e.g., 49.99)
    - Stock tracking (critical for inventory management)
    - Categories (e.g., "Geyim", "Elektronika", "Kosmetika")
    - Multiple images
    
    This replaces Instagram posts with REAL inventory management!
    """
    # Create product
    new_product = Product(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        compare_at_price=product_data.compare_at_price,
        category=product_data.category,
        tags=product_data.tags or [],
        inventory_count=product_data.inventory_count,
        track_inventory=product_data.track_inventory,
        allow_backorder=product_data.allow_backorder,
        low_stock_threshold=product_data.low_stock_threshold,
        images=product_data.images or [],
        shop_id=shop_id,
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return new_product


@router.get("/{shop_id}/products", response_model=ProductListResponse)
def list_products(
    shop_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_low_stock: Optional[bool] = Query(None, description="Show only low stock items"),
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    List all products in shop with pagination and filters.
    
    Mobile-optimized pagination (20 items default).
    Supports search, category filter, and low stock alerts.
    """
    # Base query
    query = db.query(Product).filter(Product.shop_id == shop_id)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
    
    if category:
        query = query.filter(Product.category == category)
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    if is_low_stock:
        query = query.filter(
            Product.track_inventory == True,
            Product.inventory_count <= Product.low_stock_threshold
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Calculate total pages
    total_pages = ceil(total / page_size) if total > 0 else 1
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{shop_id}/products/{product_id}", response_model=ProductResponse)
def get_product(
    shop_id: int,
    product_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Get detailed product information.
    
    Used in product edit page in admin dashboard.
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop_id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.put("/{shop_id}/products/{product_id}", response_model=ProductResponse)
def update_product(
    shop_id: int,
    product_id: int,
    product_data: ProductUpdate,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Update product details.
    
    Common updates:
    - Price changes (e.g., sales, promotions)
    - Stock adjustments (after receiving new inventory)
    - Description improvements
    - Image updates
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop_id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/{shop_id}/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    shop_id: int,
    product_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Deactivate product (soft delete).
    
    Product is hidden from storefront but preserved in database
    (important for order history).
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop_id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.is_active = False
    db.commit()
    
    return None


@router.post("/{shop_id}/products/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    shop_id: int,
    product_id: int,
    adjustment: int = Query(..., description="Stock adjustment (+10 to add, -5 to reduce)"),
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Adjust product inventory count.
    
    Use cases:
    - Received new stock: adjustment = +50
    - Found damaged items: adjustment = -3
    - Physical inventory count correction
    
    This is CRITICAL for Instagram sellers who never had stock tracking!
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop_id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if not product.track_inventory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product does not track inventory"
        )
    
    # Apply adjustment
    new_count = product.inventory_count + adjustment
    
    if new_count < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce stock below 0. Current: {product.inventory_count}, Adjustment: {adjustment}"
        )
    
    product.inventory_count = new_count
    db.commit()
    db.refresh(product)
    
    return product
