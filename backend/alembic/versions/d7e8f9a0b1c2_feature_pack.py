"""feature pack: edit window, traveller flag, socials, notifications, communities

Revision ID: d7e8f9a0b1c2
Revises: c1d2e3f4a5b6
Create Date: 2026-07-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e8f9a0b1c2'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('communities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('cover_image', sa.String(), nullable=True),
        sa.Column('invite_code', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_communities_invite_code', 'communities', ['invite_code'], unique=True)
    op.create_table('community_subgroups',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('community_id', sa.Integer(), sa.ForeignKey('communities.id'), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('interest', sa.String(), nullable=True),
    )
    op.create_table('community_members',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('community_id', sa.Integer(), sa.ForeignKey('communities.id'), nullable=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('joined_at', sa.DateTime(), nullable=True),
    )
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.add_column('events', sa.Column('traveller_friendly', sa.Boolean(), nullable=True, server_default=sa.false()))
    op.add_column('events', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('events', sa.Column('community_id', sa.Integer(), nullable=True))
    op.add_column('host_profiles', sa.Column('instagram', sa.String(), nullable=True))
    op.add_column('host_profiles', sa.Column('linkedin', sa.String(), nullable=True))
    op.add_column('host_profiles', sa.Column('website', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('host_profiles', 'website')
    op.drop_column('host_profiles', 'linkedin')
    op.drop_column('host_profiles', 'instagram')
    op.drop_column('events', 'community_id')
    op.drop_column('events', 'created_at')
    op.drop_column('events', 'traveller_friendly')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
    op.drop_table('community_members')
    op.drop_table('community_subgroups')
    op.drop_index('ix_communities_invite_code', table_name='communities')
    op.drop_table('communities')
