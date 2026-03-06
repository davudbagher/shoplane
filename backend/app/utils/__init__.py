# """Utility functions for Shoplane."""

# from app.utils.security import (
#     verify_password,
#     get_password_hash,
#     create_access_token,
#     decode_access_token,
# )
# from app.utils.dependencies import (
#     get_subdomain,
#     get_current_shop,
#     get_current_user,
#     get_current_active_user,
#     verify_shop_owner,
# )

# __all__ = [
#     # Security
#     "verify_password",
#     "get_password_hash",
#     "create_access_token",
#     "decode_access_token",
#     # Dependencies
#     "get_subdomain",
#     "get_current_shop",
#     "get_current_user",
#     "get_current_active_user",
#     "verify_shop_owner",
# ]

"""
Utility functions and dependencies for 1link.az
"""

from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)

from app.utils.dependencies import (
    get_current_shop,
    verify_shop_owner,
    # get_subdomain removed - not defined anymore
)

__all__ = [
    # Security
    "get_password_hash",
    "verify_password", 
    "create_access_token",
    
    # Dependencies
    "get_current_shop",
    "verify_shop_owner",
]