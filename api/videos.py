"""Read-only history endpoints for processed videos and their detections.

The frontend's History page needs to list, filter, paginate, and inspect prior
sessions. Detection thumbnails are served from ``DETECTION_DIR`` directly so
no separate file-management code is required — the WebSocket session writes
them during inference.
"""

import logging
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from core.config import DETECTION_DIR
from db.database import get_session
from db.schemas import Detection, DetectionOut, User, Video, VideoOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("")
async def list_videos(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=255),
    threat_type: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """List processed videos, newest first.

    ``threat_type`` filter narrows to videos that have at least one detection
    of that type. ``search`` matches ``video_name`` case-insensitively.
    """
    base = select(Video).order_by(Video.upload_time.desc())

    if search:
        base = base.where(Video.video_name.ilike(f"%{search}%"))
    if user_id is not None:
        base = base.where(Video.user_id == user_id)

    if threat_type:
        # Only include videos that have at least one detection of that type.
        sub = (
            select(Detection.video_id)
            .where(Detection.threat_type == threat_type)
            .distinct()
            .subquery()
        )
        base = base.where(Video.video_id.in_(select(sub.c.video_id)))

    total = (
        await session.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()

    rows = (await session.execute(base.limit(limit).offset(offset))).scalars().all()

    # Annotate each video with detection count via a single GROUP BY.
    if rows:
        ids = [r.video_id for r in rows]
        counts_q = (
            select(Detection.video_id, func.count(Detection.id))
            .where(Detection.video_id.in_(ids))
            .group_by(Detection.video_id)
        )
        counts = dict((await session.execute(counts_q)).all())
    else:
        counts = {}

    items = []
    for r in rows:
        out = VideoOut.model_validate(r).model_dump(mode="json")
        out["detection_count"] = counts.get(r.video_id, 0)
        items.append(out)

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(items) < total,
    }


@router.get("/{video_id}")
async def get_video(
    video_id: UUID,
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Single video with detection_count populated."""
    row = await session.get(Video, video_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    out = VideoOut.model_validate(row).model_dump(mode="json")
    count_q = select(func.count(Detection.id)).where(Detection.video_id == video_id)
    out["detection_count"] = (await session.execute(count_q)).scalar_one()
    return out


@router.get("/{video_id}/detections")
async def list_detections(
    video_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Detections for a single video, newest first."""
    exists = await session.get(Video, video_id)
    if exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    base = (
        select(Detection)
        .where(Detection.video_id == video_id)
        .order_by(Detection.timestamp.desc())
    )
    total = (
        await session.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()
    rows = (await session.execute(base.limit(limit).offset(offset))).scalars().all()

    items = [DetectionOut.model_validate(r).model_dump(mode="json") for r in rows]
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + len(items) < total,
    }


@router.get("/{video_id}/thumbnail")
async def get_thumbnail(
    video_id: UUID,
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> FileResponse:
    """First detection thumbnail (or 404 if no detections)."""
    exists = await session.get(Video, video_id)
    if exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    det_dir = Path(DETECTION_DIR) / str(video_id)
    if not det_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No thumbnail for this video",
        )
    # Filenames are ``<ms>.jpg`` — pick the earliest ms as "first".
    candidates = sorted(det_dir.glob("*.jpg"))
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No thumbnail for this video",
        )
    return FileResponse(candidates[0], media_type="image/jpeg")