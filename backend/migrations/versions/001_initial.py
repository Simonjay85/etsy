"""initial tables

Revision ID: 001_initial
Revises:
Create Date: 2025-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'templates',
        sa.Column('id',           sa.String(36),   primary_key=True),
        sa.Column('filename',     sa.String(255),  nullable=False),
        sa.Column('size_bytes',   sa.Integer(),    default=0),
        sa.Column('product_type', sa.String(32),   default='cv'),
        sa.Column('orig_accent',  sa.String(6),    nullable=True),
        sa.Column('orig_header',  sa.String(6),    nullable=True),
        sa.Column('storage_path', sa.String(512),  nullable=False),
        sa.Column('created_at',   sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'generate_jobs',
        sa.Column('id',          sa.String(36),   primary_key=True),
        sa.Column('template_id', sa.String(36),   nullable=False),
        sa.Column('status',      sa.String(16),   default='queued'),
        sa.Column('progress',    sa.Integer(),    default=0),
        sa.Column('message',     sa.String(255),  default=''),
        sa.Column('themes',      sa.JSON(),       nullable=True),
        sa.Column('fonts',       sa.JSON(),       nullable=True),
        sa.Column('pages',       sa.JSON(),       nullable=True),
        sa.Column('total',       sa.Integer(),    default=0),
        sa.Column('completed',   sa.Integer(),    default=0),
        sa.Column('zip_path',    sa.String(512),  nullable=True),
        sa.Column('error',       sa.Text(),       nullable=True),
        sa.Column('created_at',  sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'listings',
        sa.Column('id',              sa.String(36),  primary_key=True),
        sa.Column('template_id',     sa.String(36),  nullable=True),
        sa.Column('theme_id',        sa.String(64),  nullable=True),
        sa.Column('product_type',    sa.String(32),  default='cv'),
        sa.Column('title',           sa.String(140), nullable=False),
        sa.Column('description',     sa.Text(),      nullable=False),
        sa.Column('tags',            sa.JSON(),      nullable=True),
        sa.Column('price',           sa.Float(),     default=4.99),
        sa.Column('seo_score',       sa.Integer(),   nullable=True),
        sa.Column('etsy_listing_id', sa.String(64),  nullable=True),
        sa.Column('published',       sa.Boolean(),   default=False),
        sa.Column('thumbnail_url',   sa.String(512), nullable=True),
        sa.Column('created_at',      sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at',      sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'keywords',
        sa.Column('id',            sa.String(36),  primary_key=True),
        sa.Column('keyword',       sa.String(255), nullable=False, unique=True),
        sa.Column('search_volume', sa.String(32),  default='unknown'),
        sa.Column('competition',   sa.Integer(),   default=50),
        sa.Column('trend',         sa.String(16),  default='stable'),
        sa.Column('rank',          sa.String(32),  nullable=True),
        sa.Column('notes',         sa.Text(),      nullable=True),
        sa.Column('last_checked',  sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at',    sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('keywords')
    op.drop_table('listings')
    op.drop_table('generate_jobs')
    op.drop_table('templates')
