from fastapi import FastAPI, APIRouter, HTTPException, Depends, Cookie, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
import uuid
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    preferences: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    preferences: Optional[str] = None
    picture: Optional[str] = None
    role: str = "user"  # user, editor, creator, admin
    created_at: datetime

class Platform(BaseModel):
    platform_id: str
    name: str
    icon: str
    description: str
    is_active: bool = True
    created_at: datetime

class PlatformCreate(BaseModel):
    name: str
    icon: str
    description: str

class TrendRequest(BaseModel):
    platform: str
    topic: str
    time_period: str  # e.g., "Last 7 days", "Last month"
    additional_requirements: Optional[str] = None

class TrendAnalysis(BaseModel):
    analysis_id: str
    user_id: str
    platform: str
    topic: str
    time_period: str
    summary: str
    instructions: str
    examples: List[str]
    chart_data: Dict[str, Any]
    stats: Dict[str, Any]
    created_at: datetime

class SessionCreate(BaseModel):
    session_id: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_role(email: str) -> str:
    """Determine user role based on email"""
    email_lower = email.lower()
    if "disha" in email_lower or "jayanthi" in email_lower:
        return "editor"
    return "user"

async def get_current_user(
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    session_token: Optional[str] = Cookie(None)
) -> User:
    """Get current user from session token or authorization header"""
    token = None
    
    # Check cookie first
    if session_token:
        token = session_token
    # Then check authorization header
    elif authorization:
        token = authorization.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a Google OAuth session
    session_doc = await db.user_sessions.find_one({"session_token": token})
    if session_doc:
        # Verify session hasn't expired
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**user_doc)
    
    # Check if it's a JWT token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify user has admin/editor role"""
    if current_user.role not in ["editor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# Content filtering function
def is_content_safe(text: str) -> bool:
    """Check if content is safe (no 18+, illegal, unethical content)"""
    # Basic keyword filtering - extend as needed
    unsafe_keywords = ["explicit", "illegal", "hack", "violence", "nsfw", "18+"]
    text_lower = text.lower()
    return not any(keyword in text_lower for keyword in unsafe_keywords)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    """Custom email/password signup"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    role = get_user_role(user_data.email)
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "name": user_data.email.split("@")[0],
        "phone": user_data.phone,
        "age": user_data.age,
        "gender": user_data.gender,
        "preferences": user_data.preferences,
        "role": role,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token({"sub": user_id})
    
    user_response = User(**{k: v for k, v in user_doc.items() if k != "hashed_password"})
    
    return {
        "user": user_response,
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    """Custom email/password login"""
    user_doc = await db.users.find_one({"email": user_data.email})
    if not user_doc or not verify_password(user_data.password, user_doc.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token({"sub": user_doc["user_id"]})
    
    user_response = User(**{k: v for k, v in user_doc.items() if k not in ["hashed_password", "_id"]})
    
    return {
        "user": user_response,
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.post("/auth/session")
async def create_session(session_data: SessionCreate, response: Response):
    """Exchange session_id for session_token (Google OAuth)"""
    import httpx
    
    try:
        # Call Emergent Auth API
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_data.session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
            
            # Check if user exists, if not create
            user_doc = await db.users.find_one({"email": auth_data["email"]})
            if user_doc:
                user_id = user_doc["user_id"]
                # Update user info if needed
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "name": auth_data.get("name", user_doc.get("name")),
                        "picture": auth_data.get("picture", user_doc.get("picture"))
                    }}
                )
            else:
                # Create new user
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                role = get_user_role(auth_data["email"])
                user_doc = {
                    "user_id": user_id,
                    "email": auth_data["email"],
                    "name": auth_data.get("name"),
                    "picture": auth_data.get("picture"),
                    "role": role,
                    "created_at": datetime.now(timezone.utc)
                }
                await db.users.insert_one(user_doc)
            
            # Create session
            session_token = auth_data["session_token"]
            expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            
            await db.user_sessions.insert_one({
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Set httpOnly cookie
            # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                path="/",
                max_age=7*24*60*60
            )
            
            # Return user data
            user_response = await db.users.find_one({"user_id": user_id}, {"_id": 0, "hashed_password": 0})
            return {"user": User(**user_response)}
            
    except httpx.RequestError as e:
        logger.error(f"Error calling auth service: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error")

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user"""
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        samesite="none",
        secure=True
    )
    
    return {"message": "Logged out successfully"}

# ==================== PLATFORM ENDPOINTS ====================

@api_router.get("/platforms", response_model=List[Platform])
async def get_platforms():
    """Get all active platforms"""
    platforms = await db.platforms.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [Platform(**p) for p in platforms]

@api_router.post("/platforms", response_model=Platform)
async def create_platform(
    platform_data: PlatformCreate,
    current_user: User = Depends(get_admin_user)
):
    """Create a new platform (admin only)"""
    platform_id = f"platform_{uuid.uuid4().hex[:12]}"
    
    platform_doc = {
        "platform_id": platform_id,
        "name": platform_data.name,
        "icon": platform_data.icon,
        "description": platform_data.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.platforms.insert_one(platform_doc)
    return Platform(**platform_doc)

@api_router.put("/platforms/{platform_id}", response_model=Platform)
async def update_platform(
    platform_id: str,
    platform_data: PlatformCreate,
    current_user: User = Depends(get_admin_user)
):
    """Update a platform (admin only)"""
    result = await db.platforms.update_one(
        {"platform_id": platform_id},
        {"$set": {
            "name": platform_data.name,
            "icon": platform_data.icon,
            "description": platform_data.description
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    platform = await db.platforms.find_one({"platform_id": platform_id}, {"_id": 0})
    return Platform(**platform)

@api_router.delete("/platforms/{platform_id}")
async def delete_platform(
    platform_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Delete a platform (admin only)"""
    result = await db.platforms.update_one(
        {"platform_id": platform_id},
        {"$set": {"is_active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    return {"message": "Platform deleted successfully"}

# ==================== TREND ANALYSIS ENDPOINTS ====================

@api_router.post("/trends/analyze", response_model=TrendAnalysis)
async def analyze_trend(
    request_data: TrendRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze trend using AI"""
    # Content safety check
    if not is_content_safe(request_data.topic) or (request_data.additional_requirements and not is_content_safe(request_data.additional_requirements)):
        raise HTTPException(status_code=400, detail="Content contains inappropriate or unsafe keywords")
    
    try:
        # Initialize LLM Chat
        api_key = os.getenv("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"trend_{uuid.uuid4().hex[:8]}",
            system_message="You are a social media trend analyst. Analyze trends and provide insights with statistics, examples, and recommendations. Keep content safe and appropriate."
        )
        chat.with_model("openai", "gpt-5.2")
        
        # Create prompt
        prompt = f"""Analyze the social media trend on {request_data.platform} about "{request_data.topic}" for {request_data.time_period}.
        
Additional requirements: {request_data.additional_requirements or 'None'}

Provide a comprehensive analysis including:
1. A detailed summary (2-3 paragraphs)
2. Key statistics (engagement rates, growth metrics, reach estimates)
3. Instructions for users who want to leverage this trend
4. 3-5 real-world examples or similar successful posts
5. Trend progression data points for the last 7 time periods

Format your response as JSON with this structure:
{{
    "summary": "detailed summary text",
    "instructions": "step-by-step instructions",
    "examples": ["example 1", "example 2", "example 3"],
    "stats": {{
        "engagement_rate": "X%",
        "growth_trend": "increasing/stable/decreasing",
        "estimated_reach": "X million",
        "peak_time": "description"
    }},
    "chart_data": {{
        "labels": ["Day 1", "Day 2", ...],
        "values": [100, 150, 200, ...]
    }}
}}

Ensure all content is safe, legal, and appropriate. Do not include any 18+, violent, or unethical content."""

        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        try:
            # Try to extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            analysis_data = json.loads(response_text)
        except:
            # Fallback if JSON parsing fails
            analysis_data = {
                "summary": response[:500],
                "instructions": "Review the trend carefully and create authentic content that adds value.",
                "examples": ["Example content based on the trend"],
                "stats": {
                    "engagement_rate": "5-10%",
                    "growth_trend": "increasing",
                    "estimated_reach": "100K+",
                    "peak_time": "Weekdays 6-9 PM"
                },
                "chart_data": {
                    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    "values": [100, 150, 180, 220, 250, 200, 180]
                }
            }
        
        # Create analysis record
        analysis_id = f"analysis_{uuid.uuid4().hex[:12]}"
        analysis_doc = {
            "analysis_id": analysis_id,
            "user_id": current_user.user_id,
            "platform": request_data.platform,
            "topic": request_data.topic,
            "time_period": request_data.time_period,
            "summary": analysis_data.get("summary", ""),
            "instructions": analysis_data.get("instructions", ""),
            "examples": analysis_data.get("examples", []),
            "chart_data": analysis_data.get("chart_data", {}),
            "stats": analysis_data.get("stats", {}),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.trend_analyses.insert_one(analysis_doc)
        
        return TrendAnalysis(**analysis_doc)
        
    except Exception as e:
        logger.error(f"Error analyzing trend: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing trend: {str(e)}")

@api_router.get("/trends/history", response_model=List[TrendAnalysis])
async def get_trend_history(current_user: User = Depends(get_current_user)):
    """Get user's trend analysis history"""
    analyses = await db.trend_analyses.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [TrendAnalysis(**a) for a in analyses]

# ==================== CHATBOT ENDPOINT ====================

@api_router.post("/chatbot")
async def chatbot_query(
    request: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """AI chatbot assistant"""
    query = request.get("query", "")
    
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    # Content safety check
    if not is_content_safe(query):
        return {"response": "I cannot assist with that request. Please ask something appropriate."}
    
    try:
        api_key = os.getenv("EMERGENT_LLM_KEY")
        session_id = f"chatbot_{current_user.user_id}_{uuid.uuid4().hex[:6]}"
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="You are a helpful assistant for Aivora AI, a social media trend analysis app. Help users understand trends, features, and how to use the app. Keep responses concise and friendly."
        )
        chat.with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=query)
        response = await chat.send_message(user_message)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"Chatbot error: {e}", exc_info=True)
        return {"response": "I'm your Aivora AI assistant! I can help you understand social media trends, analyze platforms, and navigate the app. What would you like to know?"}

# ==================== SEED DEFAULT PLATFORMS ====================

@app.on_event("startup")
async def seed_platforms():
    """Seed default platforms if they don't exist"""
    count = await db.platforms.count_documents({})
    if count == 0:
        default_platforms = [
            {"platform_id": f"platform_{uuid.uuid4().hex[:12]}", "name": "Instagram", "icon": "📷", "description": "Photo and video sharing", "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"platform_id": f"platform_{uuid.uuid4().hex[:12]}", "name": "Facebook", "icon": "👥", "description": "Social networking", "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"platform_id": f"platform_{uuid.uuid4().hex[:12]}", "name": "SpaceX", "icon": "🚀", "description": "Space exploration updates", "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"platform_id": f"platform_{uuid.uuid4().hex[:12]}", "name": "WhatsApp", "icon": "💬", "description": "Messaging platform", "is_active": True, "created_at": datetime.now(timezone.utc)},
            {"platform_id": f"platform_{uuid.uuid4().hex[:12]}", "name": "Discord", "icon": "🎮", "description": "Community chat platform", "is_active": True, "created_at": datetime.now(timezone.utc)},
        ]
        await db.platforms.insert_many(default_platforms)
        logger.info("Seeded default platforms")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
