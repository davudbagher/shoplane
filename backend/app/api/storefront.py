from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from math import ceil
from decimal import Decimal
from datetime import datetime
from app.database import get_db
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus, PaymentStatus, PaymentMethod
from app.models.order_item import OrderItem
from app.models.coupon import Coupon
from app.schemas.shop import ShopPublicResponse
from app.schemas.product import ProductResponse, ProductListResponse
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.utils.dependencies import get_current_shop

router = APIRouter(prefix="/storefront", tags=["Storefront - Public"])


@router.get("/shop", response_model=ShopPublicResponse)
def get_shop_info(shop: Shop = Depends(get_current_shop)):
    """
    Get public shop information based on subdomain.
    
    Example: When user visits cheechak.1line.az, this returns:
    - Shop name, logo, description
    - Contact info (phone, email, address)
    - Payment options (COD, MilliKart, etc.)
    
    Used to render shop header/footer on storefront.
    """
    return shop


@router.get("/products", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=50, description="Products per page (default: 12 for mobile grid)"),
    search: Optional[str] = Query(None, description="Search by name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price in AZN"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price in AZN"),
    is_new_arrival: Optional[bool] = Query(None, description="Filter by new arrivals"),
    sort_by: Optional[str] = Query("newest", description="Sort: newest, price_asc, price_desc, popular"),
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    """
    List products in storefront (customer view).
    
    Mobile-optimized:
    - Default 12 products per page (3x4 grid on mobile)
    - Search, category filter, price range
    - Sorting options
    
    Only shows active products with stock (if tracking enabled).
    """
    # Base query: only active products
    query = db.query(Product).filter(
        Product.shop_id == shop.id,
        Product.is_active == True
    )
    
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
    
    if is_new_arrival is not None:
        query = query.filter(Product.is_new_arrival == is_new_arrival)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    # Apply sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "popular":
        query = query.filter(Product.is_featured == True).order_by(Product.created_at.desc())
    else:  # newest (default)
        query = query.order_by(Product.created_at.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()
    
    # Calculate total pages
    total_pages = ceil(total / page_size) if total > 0 else 1
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product_details(
    product_id: int,
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    """
    Get detailed product information.
    
    Used for product detail page with:
    - Full description
    - All images
    - Stock availability
    - Add to cart button
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.shop_id == shop.id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or unavailable"
        )
    
    return product


@router.get("/categories", response_model=List[str])
def get_categories(
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    """
    Get list of available product categories for filter dropdown.
    
    Returns unique categories from active products in this shop.
    """
    categories = db.query(Product.category).filter(
        Product.shop_id == shop.id,
        Product.is_active == True,
        Product.category.isnot(None)
    ).distinct().all()
    
    return [cat[0] for cat in categories if cat[0]]


from pydantic import BaseModel
class CouponValidateRequest(BaseModel):
    code: str
    items: List[dict]  # [{"product_id": 1, "price": 10.50, "quantity": 1}]

class CouponValidateResponse(BaseModel):
    is_valid: bool
    discount_amount: Decimal
    message: str

def calculate_discount(coupon: Coupon, order_items_data: list, db_products: dict) -> Decimal:
    """Helper to calculate total discount for a given cart against a coupon."""
    if not coupon.is_active:
        return Decimal("0.00")
    
    from datetime import timezone
    now = datetime.now(timezone.utc)
    if coupon.starts_at and now < coupon.starts_at:
        return Decimal("0.00")
    if coupon.ends_at and now > coupon.ends_at:
        return Decimal("0.00")
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        return Decimal("0.00")

    applicable_total = Decimal("0.00")
    
    # Calculate how much of the cart is eligible for this discount
    for item in order_items_data:
        if hasattr(item, "get"):
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
        else:
            product_id = getattr(item, "product_id", None)
            quantity = getattr(item, "quantity", 1)
        
        # Determine unit price (from db if creating order, or from frontend request if just validating)
        if product_id in db_products:
            unit_price = db_products[product_id].price
        else:
            unit_price = Decimal(str(item.get("price", "0.00")))
            
        if coupon.scope == "all_products" or (coupon.applicable_product_ids and product_id in coupon.applicable_product_ids):
            applicable_total += unit_price * quantity
            
    if applicable_total == Decimal("0.00"):
        return Decimal("0.00")
        
    if coupon.discount_type == "percentage":
        return min((applicable_total * coupon.discount_value) / Decimal("100.00"), applicable_total)
    else: # fixed_amount
        return min(coupon.discount_value, applicable_total)


@router.post("/validate-coupon", response_model=CouponValidateResponse)
def validate_coupon(
    request: CouponValidateRequest,
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    """Validate a coupon code and calculate the discount for the current cart."""
    from sqlalchemy import func
    coupon = db.query(Coupon).filter(
        Coupon.shop_id == shop.id,
        func.upper(Coupon.code) == request.code.strip().upper()
    ).first()
    
    if not coupon:
        return CouponValidateResponse(is_valid=False, discount_amount=Decimal("0.00"), message="Kupon tapılmadı")
        
    from datetime import timezone
    now = datetime.now(timezone.utc)
    if not coupon.is_active or (coupon.starts_at and now < coupon.starts_at) or (coupon.ends_at and now > coupon.ends_at):
        return CouponValidateResponse(is_valid=False, discount_amount=Decimal("0.00"), message="Kuponun vaxtı bitib və ya aktiv deyil")
        
    if coupon.usage_limit is not None and coupon.usage_count >= coupon.usage_limit:
        return CouponValidateResponse(is_valid=False, discount_amount=Decimal("0.00"), message="Kuponun istifadə limiti bitib")
        
    discount = calculate_discount(coupon, request.items, {})
    
    if discount == Decimal("0.00"):
        return CouponValidateResponse(is_valid=False, discount_amount=Decimal("0.00"), message="Bu kupon səbətdəki məhsullara aid deyil")
        
    return CouponValidateResponse(is_valid=True, discount_amount=discount, message="Kupon uğurla tətbiq edildi")


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    """
    Create a new order (CHECKOUT - THE MONEY-MAKING ENDPOINT!).
    
    This is where Azerbaijan customers complete their purchase:
    1. Select products and quantities
    2. Enter shipping info (Bakı, Gəncə, district, address)
    3. Choose payment method (COD, MilliKart, BirBank, Pasha Pay)
    4. Submit order
    
    Returns order confirmation with order number.
    """
    # Validate shop accepts chosen payment method
    if order_data.payment_method == PaymentMethod.CASH_ON_DELIVERY and not shop.allow_cod:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This shop does not accept cash on delivery"
        )
    
    if order_data.payment_method != PaymentMethod.CASH_ON_DELIVERY and not shop.allow_online_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This shop does not accept online payments"
        )
    
    # Validate products and calculate totals
    order_items = []
    subtotal = Decimal('0.00')
    
    # Calculate subtotal first
    db_products = {}
    for item_data in order_data.items:
        # Get product
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.shop_id == shop.id,
            Product.is_active == True
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found or unavailable"
            )
            
        db_products[product.id] = product
        
        # Check stock availability
        if product.track_inventory:
            if product.inventory_count < item_data.quantity and not product.allow_backorder:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' has only {product.inventory_count} in stock"
                )
        
        # Calculate item total
        item_total = product.price * item_data.quantity
        subtotal += item_total
        
        # Create order item
        order_item = OrderItem(
            product_id=product.id,
            product_name=product.name,
            product_image=product.images[0] if product.images else None,
            quantity=item_data.quantity,
            unit_price=product.price,
            total_price=item_total
        )
        order_items.append(order_item)
        
        # Reduce inventory
        if product.track_inventory:
            product.inventory_count -= item_data.quantity
            
    # Apply discount if a valid code is provided
    discount = Decimal('0.00')
    if order_data.discount_code:
        from sqlalchemy import func
        coupon = db.query(Coupon).filter(
            Coupon.shop_id == shop.id,
            func.upper(Coupon.code) == order_data.discount_code.strip().upper()
        ).with_for_update().first() # Lock coupon for usage limit
        
        if coupon:
            discount = calculate_discount(coupon, order_data.items, db_products)
            if discount > Decimal("0.00"):
                coupon.usage_count += 1
                db.add(coupon)
    
    # Calculate total
    shipping_fee = Decimal('0.00')  # TODO: Implement shipping calculation
    total = subtotal + shipping_fee - discount
    if total < Decimal("0.00"):
        total = Decimal("0.00")
    
    # Generate unique order number
    order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{db.query(Order).count() + 1:04d}"
    
    # Find or create customer (lookup by phone only - no shop_id on customers table)
    customer = db.query(Customer).filter(
        Customer.phone == order_data.customer_phone
    ).first()
    
    if not customer:
        customer = Customer(
            full_name=order_data.customer_full_name,
            phone=order_data.customer_phone,
            email=order_data.customer_email,
            city=order_data.shipping_city,
            district=order_data.shipping_district,
            address_line=order_data.shipping_address,
            postal_code=order_data.shipping_postal_code,
            delivery_notes=order_data.delivery_notes,
        )
        db.add(customer)
        db.flush()  # Get customer ID
    
    # Create order
    new_order = Order(
        order_number=order_number,
        shop_id=shop.id,
        customer_id=customer.id,
        status=OrderStatus.PENDING,
        payment_method=order_data.payment_method,
        payment_status=PaymentStatus.PENDING,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        discount=discount,
        total=total,
        customer_name=order_data.customer_full_name,
        customer_phone=order_data.customer_phone,
        customer_email=order_data.customer_email,
        shipping_city=order_data.shipping_city,
        shipping_district=order_data.shipping_district,
        shipping_address=order_data.shipping_address,
        shipping_postal_code=order_data.shipping_postal_code,
        delivery_notes=order_data.delivery_notes,
        items=order_items
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order


@router.get("/orders/{order_number}", response_model=OrderResponse)
def track_order(
    order_number: str,
    phone: str = Query(..., description="Customer phone for verification"),
    shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    """
    Track order status (order tracking page).
    
    Customers can check their order status by entering:
    - Order number (e.g., ORD-20260302-0001)
    - Phone number (for security)
    
    Shows order timeline: pending → confirmed → shipped → delivered
    """
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.shop_id == shop.id,
        Order.customer_phone == phone
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found. Please check order number and phone number."
        )
    
    return order
