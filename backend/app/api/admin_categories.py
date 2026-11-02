from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.shop import Shop
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse
from app.utils.dependencies import get_current_user, verify_shop_owner
from app.models.category import Category

router = APIRouter(tags=["Shop Categories"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = verify_shop_owner(shop_id, db)
    return db.query(Category).filter(
        Category.shop_id == shop.id
    ).order_by(
        Category.parent_id.nullsfirst(),
        Category.name
    ).all()


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    shop_id: int,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = verify_shop_owner(shop_id, db)

    if data.parent_id is not None:
        parent = db.query(Category).filter(
            Category.id == data.parent_id,
            Category.shop_id == shop.id
        ).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent category not found")

    exists = db.query(Category).filter(
        Category.shop_id == shop.id,
        Category.name == data.name,
        Category.parent_id == data.parent_id
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists at this level")

    category = Category(name=data.name, shop_id=shop.id, parent_id=data.parent_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    shop_id: int,
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shop = verify_shop_owner(shop_id, db)

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.shop_id == shop.id
    ).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    db.delete(category)
    db.commit()

    return None
