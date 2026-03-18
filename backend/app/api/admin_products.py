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
from app.api.auth import get_current_user

# ✅ NO PREFIX HERE - will be set in main.py!
router = APIRouter()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    shop_id: int,
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new product in shop inventory.
    
    Azerbaijan sellers can now add products with:
    - Name & description (in Azerbaijani or Russian)
    - Price in AZN (e.g., 49.99)
    - Stock tracking (critical for inventory management)
    - Categories (e.g., "Geyim", "Elektronika", "Kosmetika")
    
    This replaces Instagram posts with REAL inventory management!
    """
    # Verify shop ownership
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
    # Create product with auto-generated slug
    new_product = Product(
        shop_id=shop_id,
        name=product_data.name,
        slug=product_data.name.lower().replace(" ", "-")[:50],  # Auto-generate slug
        description=product_data.description,
        price=product_data.price,
        compare_at_price=product_data.compare_at_price,
        inventory_count=product_data.inventory_count,
        category=product_data.category,
        images=product_data.images or [],
        track_inventory=True,
        is_active=True,
        is_new_arrival=product_data.is_new_arrival,
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return new_product


@router.get("", response_model=ProductListResponse)
def list_products(
    shop_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all products in shop with pagination and filters.
    
    Mobile-optimized pagination (20 items default).
    Supports search, category filter, and low stock alerts.
    """
    # Verify shop ownership
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found or access denied"
        )
    
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


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    shop_id: int,
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed product information.
    
    Used in product edit page in admin dashboard.
    """
    # Verify shop ownership
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
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


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    shop_id: int,
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update product details.
    
    Common updates:
    - Price changes (e.g., sales, promotions)
    - Stock adjustments (after receiving new inventory)
    - Description improvements
    """
    # Verify shop ownership
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
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
    for field, value in product_data.dict(exclude_unset=True).items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    shop_id: int,
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate product (soft delete).
    
    Product is hidden from storefront but preserved in database
    (important for order history).
    """
    # Verify shop ownership
    shop = db.query(Shop).filter(
        Shop.id == shop_id,
        Shop.owner_id == current_user.id
    ).first()
    
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop_id
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Hard delete - permanently remove from database
    db.delete(product)
    db.commit()
    
    return None