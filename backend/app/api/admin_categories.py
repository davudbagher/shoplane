from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse
from app.api.auth import get_current_user

router = APIRouter()


def get_owned_shop(shop_id: int, current_user: User, db: Session) -> Shop:
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.owner_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found or access denied")
    return shop


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    shop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_owned_shop(shop_id, current_user, db)
    return db.query(Category).filter(Category.shop_id == shop_id).order_by(Category.name).all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    shop_id: int,
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_owned_shop(shop_id, current_user, db)

    name = data.name.strip()
    exists = db.query(Category).filter(
        Category.shop_id == shop_id,
        Category.name == name
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")

    category = Category(name=name, shop_id=shop_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    shop_id: int,
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    get_owned_shop(shop_id, current_user, db)

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.shop_id == shop_id
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    db.delete(category)
    db.commit()
