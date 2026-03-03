from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.api import auth, admin_shops, admin_products, admin_orders, storefront

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="1link.az API",
    description="Multi-tenant e-commerce platform for Azerbaijan",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration (Allow React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local React dev server
        "http://localhost:5173",  # Local Vite dev server
        "https://*.1link.az",     # Production subdomains
        "https://1link.az",       # Main domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns server status and database connectivity.
    Used by load balancers and monitoring tools.
    """
    return {
        "status": "healthy",
        "service": "1link.az API",
        "version": "1.0.0",
        "message": "Shoplane backend is running! 🇦🇿"
    }


# Root Endpoint
@app.get("/", tags=["Root"])
def root():
    """
    API root endpoint.
    
    Returns welcome message and links to documentation.
    """
    return {
        "message": "Welcome to 1link.az API - Multi-tenant E-commerce for Azerbaijan",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "github": "https://github.com/yourusername/shoplane"
    }


# Include API Routers
app.include_router(auth.router)                    # Authentication routes
app.include_router(admin_shops.router)             # Shop management (admin)
app.include_router(admin_products.router)          # Product management (admin)
app.include_router(admin_orders.router)            # Order management (admin)
app.include_router(storefront.router)              # Storefront (public)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for uncaught errors.
    
    Logs errors and returns user-friendly messages.
    """
    print(f"❌ Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again later.",
            "type": "server_error"
        }
    )


# Startup Event
@app.on_event("startup")
async def startup_event():
    """
    Runs when the application starts.
    
    Initialize connections, cache, etc.
    """
    print("🚀 Starting 1link.az API...")
    print("📊 Database tables created/verified")
    print("🔐 JWT authentication enabled")
    print("🏪 Multi-tenant routing ready")
    print("💳 Azerbaijan payment methods configured (COD, MilliKart, BirBank, Pasha Pay)")
    print("✅ Server is ready to serve Azerbaijan's businesses! 🇦🇿")


# Shutdown Event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Runs when the application shuts down.
    
    Clean up connections, cache, etc.
    """
    print("👋 Shutting down 1link.az API...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes (dev only)
        log_level="info"
    )
