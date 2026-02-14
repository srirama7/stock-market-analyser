from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./stock_analyzer.db"
    CORS_ORIGINS: str = '["http://localhost:5173","http://127.0.0.1:5173"]'
    PRICE_POLL_INTERVAL: int = 5
    INDEX_POLL_INTERVAL: int = 10
    NEWS_POLL_INTERVAL: int = 300
    PATTERN_SCAN_INTERVAL: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"


settings = Settings()
