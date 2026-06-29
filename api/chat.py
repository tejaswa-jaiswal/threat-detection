"""Heuristic "Insights" chat endpoint.

This is **not** an LLM. It produces deterministic, context-aware markdown
summaries by joining the user's latest question with summary aggregates from
the detections table. The frontend labels the panel "Insights" rather than
"AI Chat" so users are not misled.

The output is shaped as markdown so the same renderer used for real LLMs can
display it without modification. Adding a streaming or real-model backend
later is a drop-in replacement of ``_compose_response``.
"""

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from db.database import get_session
from db.schemas import Detection, User, Video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)
    video_id: str | None = None


class ChatResponse(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: str
    model_version: str = "heuristic-v1"


# --- Heuristic intent detection -------------------------------------------

_RECENT = re.compile(r"\b(recent|last|past)\b", re.I)
_SUMMARY = re.compile(r"\b(summary|summari[sz]e|overview|status)\b", re.I)
_THREATS = re.compile(r"\b(threats?|detections?|alerts?)\b", re.I)
_VIDEOS = re.compile(r"\b(videos?|sessions?|recordings?)\b", re.I)
_HIGHEST = re.compile(r"\b(highest|most|top|peak)\b", re.I)


async def _detection_summary(session: AsyncSession, window_hours: int) -> dict:
    """Counts by threat, max confidence, and total over the window."""
    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    rows = (
        await session.execute(
            select(Detection.threat_type, func.count(Detection.id)).where(
                Detection.timestamp >= since
            ).group_by(Detection.threat_type)
        )
    ).all()
    counts = {t: int(c) for t, c in rows}

    max_conf = (
        await session.execute(
            select(func.max(Detection.confidence)).where(Detection.timestamp >= since)
        )
    ).scalar_one()

    last = (
        await session.execute(
            select(Detection.timestamp)
            .where(Detection.timestamp >= since)
            .order_by(Detection.timestamp.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    total = sum(counts.values())
    return {
        "total": total,
        "counts": counts,
        "max_confidence": float(max_conf) if max_conf is not None else None,
        "last_seen": last,
    }


async def _top_threat(session: AsyncSession, window_hours: int) -> tuple[str, int] | None:
    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    row = (
        await session.execute(
            select(Detection.threat_type, func.count(Detection.id).label("c"))
            .where(Detection.timestamp >= since)
            .group_by(Detection.threat_type)
            .order_by(func.count(Detection.id).desc())
            .limit(1)
        )
    ).first()
    return (row[0], int(row[1])) if row else None


async def _video_count(session: AsyncSession, window_hours: int | None = None) -> int:
    q = select(func.count(Video.video_id))
    if window_hours is not None:
        since = datetime.now(timezone.utc) - timedelta(hours=window_hours)
        q = q.where(Video.upload_time >= since)
    return (await session.execute(q)).scalar_one()


def _format_counts(counts: dict[str, int]) -> str:
    """Render a sorted table-like list of threats and counts."""
    if not counts:
        return "_No detections in this window._"
    rows = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return "\n".join(f"- **{k}**: {v}" for k, v in rows if v > 0)


async def _compose_response(req: ChatRequest, session: AsyncSession) -> str:
    """Pick a section based on the user's latest message."""
    last_user = next(
        (m.content for m in reversed(req.messages) if m.role == "user"), ""
    )
    text = last_user.lower().strip()

    # Default window: 24 hours; tighten to 1h if user says "recent".
    window = 1 if _RECENT.search(text) else 24

    # Video-scoped: if video_id provided and question mentions it, scope to that.
    video_scope_block = ""
    if req.video_id:
        vrows = (
            await session.execute(
                select(Detection.threat_type, func.count(Detection.id)).where(
                    Detection.video_id == req.video_id
                ).group_by(Detection.threat_type)
            )
        ).all()
        vcounts = {t: int(c) for t, c in vrows}
        vtotal = sum(vcounts.values())
        video_scope_block = (
            f"\n\n### Detection breakdown for video `{req.video_id[:8]}…`\n\n"
            f"**Total:** {vtotal}\n\n{_format_counts(vcounts)}"
        )

    # 1. "summarize / status / overview" → headline + by-threat table
    if _SUMMARY.search(text) or _THREATS.search(text) or not text:
        s = await _detection_summary(session, window)
        top = await _top_threat(session, window)
        videos = await _video_count(session, window)
        last_seen = (
            s["last_seen"].strftime("%Y-%m-%d %H:%M UTC")
            if s["last_seen"]
            else "—"
        )
        top_line = (
            f"Most frequent threat: **{top[0]}** ({top[1]} detections)."
            if top
            else "No threats recorded in this window."
        )
        max_conf_disp = (
            f"{s['max_confidence']:.0%}" if s["max_confidence"] is not None else "—"
        )
        return (
            f"## Insights — last {window}h\n\n"
            f"- **Detections:** {s['total']}\n"
            f"- **Sessions:** {videos}\n"
            f"- **Peak confidence:** {max_conf_disp}\n"
            f"- **Last seen:** {last_seen}\n\n"
            f"{top_line}\n\n"
            f"### By threat\n\n{_format_counts(s['counts'])}"
            f"{video_scope_block}"
        )

    # 2. "top / most / highest" → top threat in the window
    if _HIGHEST.search(text):
        top = await _top_threat(session, window)
        if not top:
            return f"_No detections in the last {window}h to rank._"
        s = await _detection_summary(session, window)
        return (
            f"## Top threat — last {window}h\n\n"
            f"**{top[0]}** with **{top[1]}** detections "
            f"({top[1] / max(s['total'], 1):.0%} of all activity).\n\n"
            f"### Other threats\n\n{_format_counts({k: v for k, v in s['counts'].items() if k != top[0]})}"
        )

    # 3. "videos / sessions" → session stats
    if _VIDEOS.search(text):
        recent = await _video_count(session, window)
        total = await _video_count(session)
        return (
            f"## Sessions\n\n"
            f"- **Total:** {total}\n"
            f"- **Last {window}h:** {recent}\n"
        )

    # Fallback: echo a small summary.
    s = await _detection_summary(session, window)
    return (
        f"## Quick status — last {window}h\n\n"
        f"{s['total']} detections across {len([c for c in s['counts'].values() if c > 0])} threat categories."
    )


@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ChatResponse:
    """Heuristic assistant endpoint — see module docstring."""
    try:
        content = await _compose_response(req, session)
    except Exception:
        logger.exception("chat compose failed user=%s", user.id)
        content = "_The assistant is temporarily unavailable. Please retry._"
    return ChatResponse(content=content)