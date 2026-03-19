"""
Database Models
---------------
All tables for CV Studio:
- Template   : uploaded .docx files
- GenerateJob: batch generation jobs
- Listing    : Etsy listing data (title, desc, tags)
- Keyword    : tracked keyword + metrics
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, JSON, Enum as SAEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class JobStatus(str, enum.Enum):
    queued    = "queued"
    running   = "running"
    complete  = "complete"
    failed    = "failed"
    cancelled = "cancelled"


class ProductType(str, enum.Enum):
    cv           = "cv"
    planner      = "planner"
    cover_letter = "cover_letter"


class Template(Base):
    __tablename__ = "templates"

    id           = Column(String(36), primary_key=True)
    filename     = Column(String(255), nullable=False)
    size_bytes   = Column(Integer, default=0)
    product_type = Column(SAEnum(ProductType), default=ProductType.cv)
    orig_accent  = Column(String(6), nullable=True)   # detected hex
    orig_header  = Column(String(6), nullable=True)
    storage_path = Column(String(512), nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Template {self.id[:8]} {self.filename}>"


class GenerateJob(Base):
    __tablename__ = "generate_jobs"

    id           = Column(String(36), primary_key=True)
    template_id  = Column(String(36), nullable=False)
    status       = Column(SAEnum(JobStatus), default=JobStatus.queued)
    progress     = Column(Integer, default=0)
    message      = Column(String(255), default="")
    themes       = Column(JSON, default=list)
    fonts        = Column(JSON, default=list)
    pages        = Column(JSON, default=list)
    total        = Column(Integer, default=0)
    completed    = Column(Integer, default=0)
    zip_path     = Column(String(512), nullable=True)
    error        = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    finished_at  = Column(DateTime(timezone=True), nullable=True)


class Listing(Base):
    __tablename__ = "listings"

    id              = Column(String(36), primary_key=True)
    template_id     = Column(String(36), nullable=True)
    theme_id        = Column(String(64), nullable=True)
    product_type    = Column(SAEnum(ProductType), default=ProductType.cv)
    title           = Column(String(140), nullable=False)
    description     = Column(Text, nullable=False)
    tags            = Column(JSON, default=list)       # list of str
    price           = Column(Float, default=4.99)
    seo_score       = Column(Integer, nullable=True)
    etsy_listing_id = Column(String(64), nullable=True)  # after publishing
    published       = Column(Boolean, default=False)
    thumbnail_url   = Column(String(512), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())


class Keyword(Base):
    __tablename__ = "keywords"

    id             = Column(String(36), primary_key=True)
    keyword        = Column(String(255), nullable=False, unique=True)
    search_volume  = Column(String(32), default="unknown")   # "~12k/mo"
    competition    = Column(Integer, default=50)             # 0-100
    trend          = Column(String(16), default="stable")    # rising|stable|declining
    rank           = Column(String(32), nullable=True)       # "Top 15"
    notes          = Column(Text, nullable=True)
    last_checked   = Column(DateTime(timezone=True), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
