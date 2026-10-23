from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expires_in: str = "7d"
    cors_origins: str = "http://localhost:3000"
    max_code_bytes: int = 100_000
    max_output_chars: int = 10_000
    execution_mode: str = "mock"
    execution_api_url: str = "http://localhost:2000"
    run_timeout_ms: int = 10_000
    realtime_port: int = 4001

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
