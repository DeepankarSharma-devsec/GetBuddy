"""add users.deletion_requested

Revision ID: c1d2e3f4a5b6
Revises: 0a16f438db8c
Create Date: 2026-07-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = '0a16f438db8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('deletion_requested', sa.Boolean(), nullable=True, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column('users', 'deletion_requested')
