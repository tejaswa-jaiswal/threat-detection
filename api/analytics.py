"""Aggregate analytics endpoints powering the Analytics page.

All queries are single SQL statements — the frontend never needs to aggregate
client-side. Heavy aggregates (timeline, trends) are time-bucketed so a single
query returns the full series the chart needs.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from db.database import get_session
from db.schemas import Detection, User, Video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def summary(
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Headline numbers: totals and last-24h activity."""
    total_videos = (await session.execute(select(func.count(Video.video_id)))).scalar_one()
    total_detections = (
        await session.execute(select(func.count(Detection.id)))
    ).scalar_one()

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    last_24h = (
        await session.execute(
            select(func.count(Detection.id)).where(Detection.timestamp >= since)
        )
    ).scalar_one()

    # Active sessions: videos uploaded in the last hour with no end_time stamp yet.
    active_cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    active = (
        await session.execute(
            select(func.count(Video.video_id)).where(
                Video.upload_time >= active_cutoff,
                Video.end_time.is_(None),
            )
        )
    ).scalar_one()

    return {
        "total_videos": total_videos,
        "total_detections": total_detections,
        "last_24h_detections": last_24h,
        "active_sessions": active,
    }


@router.get("/distribution")
async def distribution(
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Detection counts grouped by threat_type."""
    rows = (
        await session.execute(
            select(Detection.threat_type, func.count(Detection.id)).group_by(
                Detection.threat_type
            )
        )
    ).all()
    counts = {t: 0 for t in ("Knife", "Gun", "Explosives", "Grenade")}
    for threat, count in rows:
        if threat in counts:
            counts[threat] = int(count)
    return {"by_threat": counts}


@router.get("/timeline")
async def timeline(
    bucket: str = Query(default="hour", pattern="^(hour|day)$"),
    hours: int = Query(default=24, ge=1, le=24 * 30),
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Time-bucketed series of detections. Bucket size is fixed by ``bucket``."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    if bucket == "hour":
        # date_trunc('hour', ts) gives a clean timestamp per bucket.
        bucket_col = func.date_trunc("hour", Detection.timestamp).label("ts")
    else:
        bucket_col = func.date_trunc("day", Detection.timestamp).label("ts")

    threat_col = Detection.threat_type.label("threat")
    count_col = func.count(Detection.id).label("count")

    q = (
        select(bucket_col, threat_col, count_col)
        .where(Detection.timestamp >= since)
        .group_by(bucket_col, threat_col)
        .order_by(bucket_col)
    )
    rows = (await session.execute(q)).all()

    # Reshape: [{ts, by_threat: {Knife: 3, Gun: 1, ...}}]
    series: dict[str, dict] = {}
    for ts, threat, count in rows:
        key = ts.isoformat()
        if key not in series:
            series[key] = {"Knife": 0, "Gun": 0, "Explosives": 0, "Grenade": 0}
        series[key][threat] = int(count)

    return {"bucket": bucket, "items": [{"ts": k, **v} for k, v in series.items()]}


@router.get("/trends")
async def trends(
    days: int = Query(default=14, ge=1, le=90),
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),
) -> dict:
    """Daily detection counts for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    day_col = func.date_trunc("day", Detection.timestamp).label("day")
    q = (
        select(day_col, func.count(Detection.id).label("count"))
        .where(Detection.timestamp >= since)
        .group_by(day_col)
        .order_by(day_col)
    )
    rows = (await session.execute(q)).all()
    return {"items": [{"date": d.date().isoformat(), "count": int(c)} for d, c in rows]}
