from typing import Literal

from pydantic import BaseModel

from db.schemas import UserOut, UserLogin

__all__ = ["Token", "UserLogin", "UserOut"]


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut
