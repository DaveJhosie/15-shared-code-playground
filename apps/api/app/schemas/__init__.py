import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )


class RegisterRequest(ApiModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(ApiModel):
    email: str
    password: str = Field(min_length=1)


class ProjectCreate(ApiModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class ProjectPatch(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str | None) -> str:
        if value is None:
            raise ValueError("name cannot be null")
        return value


class MemberCreate(ApiModel):
    email: EmailStr
    role: str

    @field_validator("role")
    @classmethod
    def valid_role(cls, value: str) -> str:
        if value not in {"editor", "viewer"}:
            raise ValueError("role must be editor or viewer")
        return value


class MemberRolePatch(ApiModel):
    role: str

    @field_validator("role")
    @classmethod
    def valid_role(cls, value: str) -> str:
        if value not in {"editor", "viewer"}:
            raise ValueError("role must be editor or viewer")
        return value


class FileCreate(ApiModel):
    name: str = Field(min_length=1, max_length=100)
    language: str = "javascript"
    content: str = ""

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        if "/" in value or "\\" in value:
            raise ValueError("name cannot contain a path separator")
        return value

    @field_validator("language")
    @classmethod
    def valid_language(cls, value: str) -> str:
        if value not in {"javascript", "python"}:
            raise ValueError("language must be javascript or python")
        return value


class FilePatch(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    language: str | None = None

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("name cannot be null")
        if value is not None and ("/" in value or "\\" in value):
            raise ValueError("name cannot contain a path separator")
        return value

    @field_validator("language")
    @classmethod
    def valid_language(cls, value: str | None) -> str | None:
        if value is None:
            raise ValueError("language cannot be null")
        if value is not None and value not in {"javascript", "python"}:
            raise ValueError("language must be javascript or python")
        return value


class VersionCreate(ApiModel):
    label: str | None = Field(default=None, max_length=100)
    content: str


class RunRequest(ApiModel):
    code: str
    stdin: str = ""
