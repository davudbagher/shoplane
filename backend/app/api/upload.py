from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from io import BytesIO
from PIL import Image
from typing import Dict
import os
import uuid

from app.config import settings
from app.models.user import User
from app.utils.dependencies import get_current_user

router = APIRouter()
public_router = APIRouter()

UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Formats are detected from the file contents, never from the client's filename.
# SVG is deliberately excluded: it can carry scripts.
ALLOWED_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}


def _save_image(file: UploadFile, max_size: int) -> Dict[str, str]:
    contents = file.file.read(max_size + 1)
    if len(contents) > max_size:
        raise HTTPException(status_code=413, detail="Şəkil ölçüsü çox böyükdür")

    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()
            ext = ALLOWED_FORMATS.get(image.format)
    except Exception:
        ext = None

    if not ext:
        raise HTTPException(status_code=400, detail="Yalnız JPG, PNG və WEBP şəkilləri qəbul olunur")

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as buffer:
        buffer.write(contents)

    # Return absolute URL for the frontend to save in the database
    return {"url": f"{settings.API_URL}/uploads/images/{filename}"}


@router.post("")
def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    return _save_image(file, settings.MAX_UPLOAD_SIZE)


@public_router.post("")
def upload_public_image(file: UploadFile = File(...)) -> Dict[str, str]:
    """Logo/banner upload for the landing page signup form, which has no login."""
    return _save_image(file, settings.MAX_PUBLIC_UPLOAD_SIZE)
