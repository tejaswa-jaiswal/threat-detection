"""Seed a user with a bcrypt-hashed password.

Usage:
    uv run python -m scripts.seed_user <email> <password> [name] [role]

If a user with the given email already exists, no row is inserted.
"""

import argparse
import asyncio
import logging
import sys

from sqlalchemy.dialects.postgresql import insert as pg_insert

from core.security import hash_password
from db.database import AsyncSessionLocal
from db.schemas import USER_ROLES, User

logger = logging.getLogger(__name__)


async def seed(email: str, password: str, name: str, role: str) -> None:
    if role not in USER_ROLES:
        raise SystemExit(f"invalid role {role!r}; must be one of {USER_ROLES}")

    stmt = (
        pg_insert(User)
        .values(
            email=email,
            name=name,
            password_hash=hash_password(password),
            role=role,
        )
        .on_conflict_do_nothing(index_elements=["email"])
        .returning(User.id)
    )

    async with AsyncSessionLocal() as session:
        result = await session.execute(stmt)
        await session.commit()
        inserted = result.scalar_one_or_none()

    if inserted is None:
        logger.info("user %s already exists; nothing inserted", email)
    else:
        logger.info("user %s created id=%s role=%s", email, inserted, role)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("email")
    p.add_argument("password")
    p.add_argument("name", nargs="?", default=None)
    p.add_argument("role", nargs="?", default="viewer")
    args = p.parse_args()

    name = args.name or args.email.split("@", 1)[0]
    try:
        asyncio.run(seed(args.email, args.password, name, args.role))
    except SystemExit:
        raise
    except Exception:
        logger.exception("seed failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
