from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    shop_id: int,
    coupon_data: CouponCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or access denied")
    
    existing = db.query(Coupon).filter(Coupon.shop_id == shop_id, Coupon.code == coupon_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists for this shop")
        
    new_coupon = Coupon(
        shop_id=shop_id,
        code=coupon_data.code,
        discount_type=coupon_data.discount_type,
        discount_value=coupon_data.discount_value,
        scope=coupon_data.scope,
        applicable_product_ids=coupon_data.applicable_product_ids or [],
        starts_at=coupon_data.starts_at,
        ends_at=coupon_data.ends_at,
        usage_limit=coupon_data.usage_limit,
        is_active=True
    )
    db.add(new_coupon)
    db.commit()
    db.refresh(new_coupon)
    return new_coupon

@router.get("", response_model=List[CouponResponse])
def list_coupons(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return db.query(Coupon).filter(Coupon.shop_id == shop_id).all()

@router.get("/{coupon_id}", response_model=CouponResponse)
def get_coupon(
    shop_id: int,
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id, Coupon.shop_id == shop_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon

@router.put("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    shop_id: int,
    coupon_id: int,
    coupon_data: CouponUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id, Coupon.shop_id == shop_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    for field, value in coupon_data.dict(exclude_unset=True).items():
        setattr(coupon, field, value)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(
    shop_id: int,
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id, Coupon.shop_id == shop_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(coupon)
    db.commit()
    return None
