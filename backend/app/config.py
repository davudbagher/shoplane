from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration settings."""
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # Application
    APP_NAME: str = "Shoplane"
    DEBUG: bool = True
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    
    # Domain Configuration
    BASE_DOMAIN: str = "1line.az"
    ADMIN_SUBDOMAIN: str = "admin"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"
    
    # Subscription Plans (AZN)
    BASE_PLAN_PRICE: int = 49
    PRO_PLAN_PRICE: int = 79
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    UPLOAD_DIR: str = "uploads/products"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def allowed_hosts_list(self) -> List[str]:
        """Parse allowed hosts into list."""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()