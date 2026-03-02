from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from math import ceil
from datetime import datetime, timedelta
from decimal import Decimal
from app.database import get_db
from app.models.user import User
from app.models.shop import Shop
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.product import Product
from app.schemas.order import OrderUpdateStatus, OrderResponse, OrderListResponse, OrderStatsResponse
from app.utils.dependencies import get_current_user, verify_shop_owner

router = APIRouter(prefix="/admin/orders", tags=["Admin - Orders"])


@router.get("/{shop_id}/orders", response_model=OrderListResponse)
def list_orders(
    shop_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    search: Optional[str] = Query(None, description="Search by order number or customer name"),
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    List all orders for shop (mobile-optimized pagination).
    
    Azerbaijan sellers can filter by:
    - Order status (pending, confirmed, shipped, delivered)
    - Payment method (cash_on_delivery, millikart, birbank, pasha_pay)
    - Customer search
    
    Default sort: newest first (most urgent orders at top).
    """
    # Base query
    query = db.query(Order).filter(Order.shop_id == shop_id)
    
    # Apply filters
    if status:
        query = query.filter(Order.status == status)
    
    if payment_method:
        query = query.filter(Order.payment_method == payment_method)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Order.order_number.ilike(search_term)) |
            (Order.customer_name.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Calculate total pages
    total_pages = ceil(total / page_size) if total > 0 else 1
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{shop_id}/orders/{order_id}", response_model=OrderResponse)
def get_order_details(
    shop_id: int,
    order_id: int,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Get detailed order information.
    
    Includes:
    - Customer shipping details (for COD delivery)
    - Order items with product names and images
    - Payment status (for MilliKart/BirBank tracking)
    - Order timeline (created → confirmed → shipped → delivered)
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.shop_id == shop_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.put("/{shop_id}/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    shop_id: int,
    order_id: int,
    status_update: OrderUpdateStatus,
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Update order status (THE CRITICAL WORKFLOW).
    
    Status flow:
    1. PENDING → Shop owner reviews order
    2. CONFIRMED → Shop owner accepts order, prepares package
    3. PROCESSING → Package is being prepared
    4. SHIPPED → Handed to courier (DHL, Azerpost, etc.)
    5. DELIVERED → Customer received (payment collected for COD)
    6. CANCELLED → Order cancelled (refund if online payment)
    
    This is where Azerbaijan sellers track their fulfillment!
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.shop_id == shop_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update status
    old_status = order.status
    order.status = status_update.status
    
    # Update timestamp based on new status
    if status_update.status == OrderStatus.CONFIRMED and not order.confirmed_at:
        order.confirmed_at = datetime.utcnow()
    
    elif status_update.status == OrderStatus.SHIPPED and not order.shipped_at:
        order.shipped_at = datetime.utcnow()
    
    elif status_update.status == OrderStatus.DELIVERED and not order.delivered_at:
        order.delivered_at = datetime.utcnow()
        
        # Mark payment as completed for COD
        if order.is_cod:
            order.payment_status = PaymentStatus.COMPLETED
    
    # Add admin notes if provided
    if status_update.admin_notes:
        order.admin_notes = status_update.admin_notes
    
    db.commit()
    db.refresh(order)
    
    return order


@router.get("/{shop_id}/stats", response_model=OrderStatsResponse)
def get_order_statistics(
    shop_id: int,
    days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Get order statistics for shop dashboard.
    
    CRITICAL for Azerbaijan sellers to track:
    - Total revenue in AZN
    - Order count by status (urgent: pending orders need attention!)
    - Average order value
    
    This replaces Excel sheets and WhatsApp message counting!
    """
    # Date range
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Base query for period
    base_query = db.query(Order).filter(
        Order.shop_id == shop_id,
        Order.created_at >= start_date
    )
    
    # Total orders
    total_orders = base_query.count()
    
    # Orders by status
    pending_orders = base_query.filter(Order.status == OrderStatus.PENDING).count()
    confirmed_orders = base_query.filter(Order.status == OrderStatus.CONFIRMED).count()
    processing_orders = base_query.filter(Order.status == OrderStatus.PROCESSING).count()
    shipped_orders = base_query.filter(Order.status == OrderStatus.SHIPPED).count()
    delivered_orders = base_query.filter(Order.status == OrderStatus.DELIVERED).count()
    cancelled_orders = base_query.filter(Order.status == OrderStatus.CANCELLED).count()
    
    # Revenue calculation (only completed orders)
    total_revenue = db.query(func.sum(Order.total)).filter(
        Order.shop_id == shop_id,
        Order.created_at >= start_date,
        Order.payment_status == PaymentStatus.COMPLETED
    ).scalar() or Decimal('0.00')
    
    # Average order value
    avg_order_value = Decimal('0.00')
    if delivered_orders > 0:
        avg_order_value = total_revenue / delivered_orders
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "processing_orders": processing_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "total_revenue": total_revenue,
        "average_order_value": avg_order_value,
    }


@router.post("/{shop_id}/orders/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    shop_id: int,
    order_id: int,
    reason: Optional[str] = Query(None, max_length=200),
    shop: Shop = Depends(verify_shop_owner),
    db: Session = Depends(get_db)
):
    """
    Cancel an order.
    
    Use cases:
    - Customer requested cancellation
    - Product out of stock
    - Unable to deliver to address
    
    If paid online (MilliKart/BirBank), refund must be processed separately.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.shop_id == shop_id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Can't cancel delivered orders
    if order.status == OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel delivered orders. Process as return instead."
        )
    
    # Update status
    order.status = OrderStatus.CANCELLED
    order.payment_status = PaymentStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()
    
    if reason:
        order.admin_notes = f"Cancellation reason: {reason}"
    
    # Restore inventory for cancelled orders
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product and product.track_inventory:
            product.inventory_count += item.quantity
    
    db.commit()
    db.refresh(order)
    
    return order