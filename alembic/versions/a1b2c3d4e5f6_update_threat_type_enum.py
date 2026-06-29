"""update threat_type enum values

Revision ID: a1b2c3d4e5f6
Revises: 77c3939b62cd
Create Date: 2026-06-29 10:39:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '77c3939b62cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Old values in the DB enum
OLD_VALUES = ('weapon', 'violence', 'intrusion', 'fire', 'suspicious_behavior', 'other')
# New values expected by the application
NEW_VALUES = ('Knife', 'Gun', 'Explosives', 'Grenade')


def upgrade() -> None:
    """Replace the threat_type enum with the new set of values."""
    # 1. Create the new enum type
    op.execute("CREATE TYPE threat_type_new AS ENUM ('Knife', 'Gun', 'Explosives', 'Grenade')")

    # 2. Drop the default/constraint, alter column to use new enum
    op.execute("""
        ALTER TABLE detections
        ALTER COLUMN threat_type TYPE threat_type_new
        USING threat_type::text::threat_type_new
    """)

    # 3. Drop old enum and rename new one
    op.execute("DROP TYPE threat_type")
    op.execute("ALTER TYPE threat_type_new RENAME TO threat_type")


def downgrade() -> None:
    """Revert to the original threat_type enum."""
    op.execute(
        "CREATE TYPE threat_type_old AS ENUM "
        "('weapon', 'violence', 'intrusion', 'fire', 'suspicious_behavior', 'other')"
    )
    op.execute("""
        ALTER TABLE detections
        ALTER COLUMN threat_type TYPE threat_type_old
        USING threat_type::text::threat_type_old
    """)
    op.execute("DROP TYPE threat_type")
    op.execute("ALTER TYPE threat_type_old RENAME TO threat_type")
