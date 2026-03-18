from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict
import os
import shutil
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_image(file: UploadFile = File(...)) -> Dict[str, str]:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul olunur")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return absolute URL for the frontend to save in the database
    return {"url": f"http://localhost:8000/uploads/images/{filename}"}
