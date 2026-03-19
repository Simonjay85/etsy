# CV Studio — API Reference

Base URL: `http://localhost:8000/api/v1`

---

## Templates

### Upload template
`POST /generate/upload`

Upload a `.docx` file. Returns `template_id` for use in batch generation.

```bash
curl -X POST /generate/upload \
  -F "file=@resume.docx"
# → {"template_id": "uuid", "filename": "resume.docx", "size": 445335}
```

### List templates
`GET /templates/`

---

## Generate

### Start batch job
`POST /generate/batch`

```json
{
  "template_id": "uuid",
  "themes": ["midnight_navy", "forest_green", "burgundy"],
  "fonts":  ["Calibri", "Georgia"],
  "pages":  ["A4", "USLetter"],
  "product_type": "cv"
}
```

Returns immediately: `{"job_id": "uuid", "status": "queued", "total": 12}`

Poll `/jobs/{job_id}` for progress.

### Download ZIP
`GET /generate/download/{job_id}/zip`

Returns the ZIP bundle when job is complete.

---

## Jobs

### Poll status
`GET /jobs/{job_id}`

```json
{
  "job_id": "uuid",
  "status": "running",       // queued | running | complete | failed
  "progress": 45,
  "message": "Creating CV_Forest_Green_Georgia_A4.docx...",
  "download_url": "/api/v1/generate/download/uuid/zip"
}
```

### Cancel job
`DELETE /jobs/{job_id}`

---

## Image

### Render PNG from DOCX
`POST /image/render-png`

Upload a `.docx`, get back a PNG of page 1.

```bash
curl -X POST /image/render-png \
  -F "file=@resume.docx" \
  --output preview.png
```

### Generate Etsy thumbnail
`POST /image/thumbnail`

```json
{
  "job_id": "uuid",
  "preview_pngs": ["/path/to/preview.png"],
  "title": "Midnight Navy Resume Template",
  "style": "mockup"
}
```

`style` options: `single` | `grid` | `mockup`

---

## AI

### Generate listing
`POST /ai/generate-listing`

```json
{
  "template_name": "Midnight Navy Resume",
  "theme_color":   "Midnight Navy",
  "product_type":  "cv",
  "target_industry": "tech",
  "language": "en"
}
```

Returns: `{title, description, tags[13], price_suggestion, seo_notes}`

### Analyze keyword
`POST /ai/analyze-keyword`

```json
{"keyword": "resume template ats", "niche": "resume template"}
```

Returns: `{keyword, search_volume, competition, trend, long_tail_suggestions[5], recommendation}`

### SEO score
`POST /ai/seo-score`

```json
{
  "title": "...",
  "tags": ["tag1", ...],
  "description": "..."
}
```

Returns: `{total, title_score, tags_score, description_score, conversion_score, issues[], improvements[]}`

---

## Planner

### Generate planner
`POST /planner/generate`

```json
{
  "layout":      "weekly",
  "year":        2025,
  "pages":       52,
  "page_format": "A4",
  "theme_id":    "midnight_navy"
}
```

Returns the `.docx` file directly (streaming download).

`layout` options: `weekly` | `monthly` | `daily` | `habit` | `budget` | `notes`

---

## Etsy

### Check connection
`GET /etsy/status`

### Start OAuth
`GET /etsy/auth` → redirects to Etsy consent page

### Publish listing
`POST /etsy/publish`

```json
{
  "shop_id":        "YourShopName",
  "title":          "...",
  "description":    "...",
  "tags":           ["tag1", ...],
  "price":          4.99,
  "docx_path":      "/path/to/bundle.zip",
  "thumbnail_path": "/path/to/thumbnail.jpg",
  "activate":       false
}
```

Returns: `{etsy_listing_id, state, url}`

### Activate draft
`POST /etsy/activate/{etsy_listing_id}?shop_id=YourShop`

---

## Available themes

| ID | Name | Accent color |
|----|------|-------------|
| `teal_original`  | Teal           | #5C94A3 |
| `midnight_navy`  | Midnight Navy  | #3A6186 |
| `forest_green`   | Forest Green   | #2E7D52 |
| `burgundy`       | Burgundy       | #8B2635 |
| `deep_purple`    | Deep Purple    | #5B3A8C |
| `charcoal`       | Charcoal       | #546E7A |
| `terracotta`     | Terracotta     | #A0522D |
| `slate_blue`     | Slate Blue     | #4A6FA5 |
| `rose_gold`      | Rose Gold      | #B5656A |
| `ocean`          | Ocean          | #1E7A8C |
| `olive_green`    | Olive Green    | #5C6B2A |
| `warm_brown`     | Warm Brown     | #7B5C3A |
