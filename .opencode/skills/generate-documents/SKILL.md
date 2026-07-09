---
name: generate-documents
description: Generate Word (.docx) and PDF documents. Use when user asks to create, generate, or export documents, reports, invoices, certificates, contracts, or any printable file format.
---

# Generate Documents

Generate professional Word (.docx) and PDF documents from structured data.

## When to Use

- User asks to create a document, report, invoice, certificate, or contract
- User wants to export data to Word or PDF format
- User needs a printable document with tables, headings, and formatted content

## Usage

### Word (.docx)

```bash
# Con JSON directo
node .opencode/skills/generate-documents/scripts/generate-docx.js "<output-path>" '<json-data>'

# Con archivo JSON
node .opencode/skills/generate-documents/scripts/generate-docx.js "<output-path>" --file <json-file>
```

### PDF

```bash
# Con JSON directo
node .opencode/skills/generate-documents/scripts/generate-pdf.js "<output-path>" '<json-data>'

# Con archivo JSON
node .opencode/skills/generate-documents/scripts/generate-pdf.js "<output-path>" --file <json-file>
```

### Arguments

- `output-path`: Full path where the file will be saved (e.g., `./report.docx`)
- `json-data`: JSON string with the document structure (see format below)

## JSON Data Format

```json
{
  "title": "Document Title",
  "subtitle": "Optional subtitle",
  "date": "2026-06-30",
  "content": [
    { "type": "heading", "level": 1, "text": "Section Title" },
    { "type": "paragraph", "text": "Normal paragraph text." },
    { "type": "paragraph", "text": "Bold text and italic text.", "bold": true },
    { "type": "list", "items": ["Item 1", "Item 2", "Item 3"] },
    { "type": "table", "headers": ["Col1", "Col2"], "rows": [["A", "B"], ["C", "D"]] },
    { "type": "spacer", "height": 20 },
    { "type": "line" }
  ]
}
```

## Content Types

| Type | Properties | Description |
|------|-----------|-------------|
| `heading` | `text`, `level` (1-6) | Section heading |
| `paragraph` | `text`, `bold`, `italic`, `alignment` | Text paragraph |
| `list` | `items[]` | Bulleted list |
| `table` | `headers[]`, `rows[][]` | Data table |
| `spacer` | `height` (px) | Vertical space |
| `line` | - | Horizontal separator |

## Examples

### Simple Letter

```json
{
  "title": "Carta de Presentación",
  "subtitle": "Juan Pérez",
  "date": "2026-06-30",
  "content": [
    { "type": "paragraph", "text": "Estimado señor:" },
    { "type": "spacer", "height": 10 },
    { "type": "paragraph", "text": "Me dirijo a usted para expresar mi interés en el puesto de desarrollador." },
    { "type": "spacer", "height": 10 },
    { "type": "paragraph", "text": "Atentamente," },
    { "type": "paragraph", "text": "Juan Pérez" }
  ]
}
```

### Invoice

```json
{
  "title": "FACTURA",
  "subtitle": "N° 001-2026",
  "date": "2026-06-30",
  "content": [
    { "type": "heading", "level": 2, "text": "Datos del Cliente" },
    { "type": "paragraph", "text": "Cliente: Empresa XYZ S.A." },
    { "type": "paragraph", "text": "NIT: 900123456-7" },
    { "type": "spacer", "height": 15 },
    { "type": "heading", "level": 2, "text": "Detalle" },
    { "type": "table", "headers": ["Concepto", "Valor"], "rows": [["Servicio de consultoría", "$1.500.000"], ["IVA (19%)", "$285.000"], ["Total", "$1.785.000"]] }
  ]
}
```

## Output

- Word files are saved as `.docx` format
- PDF files are saved as standard PDF
- Files are created in the specified output path
- Print confirmation message with file size after generation
