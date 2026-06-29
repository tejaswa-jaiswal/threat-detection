from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

UserRole = Literal["admin", "operator", "viewer"]
ThreatType = Literal[
    "Knife",
    "Gun",
    "Explosives",
    "Grenade"
]

USER_ROLES: tuple[str, ...] = ("admin", "operator", "viewer")
THREAT_TYPES: tuple[str, ...] = (
    "Knife",
    "Gun",
    "Explosives",
    "Grenade"   
)


class Base(DeclarativeBase):
    pass


user_role_enum = SAEnum(
    *USER_ROLES,
    name="user_role",
    create_constraint=True,
)

threat_type_enum = SAEnum(
    *THREAT_TYPES,
    name="threat_type",
    create_constraint=True,
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        user_role_enum,
        nullable=False,
        server_default="viewer",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    videos: Mapped[list["Video"]] = relationship(back_populates="uploader")


class Video(Base):
    __tablename__ = "videos"

    video_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    video_name: Mapped[str] = mapped_column(String(255), nullable=False)
    video_path: Mapped[str] = mapped_column(Text, nullable=False)
    upload_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    uploader: Mapped[User | None] = relationship(back_populates="videos")
    detections: Mapped[list["Detection"]] = relationship(
        back_populates="video", cascade="all, delete-orphan"
    )


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[UUID] = mapped_column(
        ForeignKey("videos.video_id", ondelete="CASCADE"),
        nullable=False,
    )
    threat_type: Mapped[str] = mapped_column(threat_type_enum, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    path_image: Mapped[str] = mapped_column(Text, nullable=False)

    video: Mapped[Video] = relationship(back_populates="detections")

    __table_args__ = (
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="confidence_range"),
        Index("ix_detections_video_timestamp", "video_id", "timestamp"),
    )


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = "viewer"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class VideoCreate(BaseModel):
    video_name: str = Field(min_length=1, max_length=255)
    video_path: str = Field(min_length=1)


class VideoOut(BaseModel):
    video_id: UUID
    video_name: str
    video_path: str
    upload_time: datetime
    end_time: datetime | None = None
    user_id: int | None = None
    model_config = ConfigDict(from_attributes=True)


class DetectionCreate(BaseModel):
    video_id: UUID
    threat_type: ThreatType
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime | None = None
    path_image: str = Field(min_length=1)


class DetectionOut(BaseModel):
    id: int
    video_id: UUID
    threat_type: ThreatType
    confidence: float
    timestamp: datetime
    path_image: str
    model_config = ConfigDict(from_attributes=True)
