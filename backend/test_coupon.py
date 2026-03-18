from app.database import SessionLocal
from app.models.coupon import Coupon
from app.api.storefront import validate_coupon, CouponValidateRequest
from pydantic import BaseModel

db = SessionLocal()
class FakeShop:
    id = 1

print("Testing validate_coupon...")
try:
    req = CouponValidateRequest(code="rolandas", items=[{"product_id": 1, "price": 100, "quantity": 1}])
    resp = validate_coupon(request=req, shop=FakeShop(), db=db)
    print("Response:", resp)
except Exception as e:
    import traceback
    traceback.print_exc()
