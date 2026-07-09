import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: node generate-docx.js <output-path> '<json-data>'");
  console.error("       node generate-docx.js <output-path> --file <json-file>");
  process.exit(1);
}

const outputPath = args[0];
let data;

try {
  if (args[1] === "--file" && args[2]) {
    const fileContent = readFileSync(args[2], "utf-8");
    data = JSON.parse(fileContent);
  } else {
    data = JSON.parse(args[1]);
  }
} catch (e) {
  console.error("Invalid JSON data:", e.message);
  process.exit(1);
}

function createContent(contentItems = []) {
  const children = [];

  for (const item of contentItems) {
    switch (item.type) {
          case "heading": {
        const levels = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        const headingSizes = { 1: 32, 2: 28, 3: 24, 4: 22, 5: 20, 6: 18 };
        children.push(
          new Paragraph({
            heading: levels[item.level] || HeadingLevel.HEADING_1,
            children: [new TextRun({ text: item.text, bold: true, size: headingSizes[item.level] || 28 })],
            spacing: { before: 360, after: 180 },
          })
        );
        break;
      }

      case "paragraph": {
        const run = new TextRun({
          text: item.text,
          bold: item.bold || false,
          italics: item.italic || false,
          size: item.bold ? 24 : 22,
        });

        const alignment = {
          left: AlignmentType.LEFT,
          center: AlignmentType.CENTER,
          right: AlignmentType.RIGHT,
          justified: AlignmentType.JUSTIFIED,
        };

        children.push(
          new Paragraph({
            children: [run],
            alignment: alignment[item.alignment] || AlignmentType.JUSTIFIED,
            spacing: { after: 160, line: 360 },
          })
        );
        break;
      }

      case "list": {
        for (const listItem of item.items || []) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${listItem}`, size: 22 })],
              spacing: { after: 80, line: 340 },
              indent: { left: 480 },
            })
          );
        }
        break;
      }

      case "table": {
        const headerCells = (item.headers || []).map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: header, bold: true, size: 20 })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 40 },
                }),
              ],
              shading: { fill: "2B579A" },
              width: { size: 100 / (item.headers?.length || 1), type: WidthType.PERCENTAGE },
              verticalAlign: "center",
            })
        );

        const headerRow = new TableRow({ children: headerCells, tableHeader: true });

        const dataRows = (item.rows || []).map(
          (row, rowIndex) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: cell, size: 20 })],
                      spacing: { before: 30, after: 30 },
                    })],
                    shading: rowIndex % 2 === 0 ? { fill: "F2F2F2" } : undefined,
                    width: { size: 100 / (item.headers?.length || 1), type: WidthType.PERCENTAGE },
                    verticalAlign: "center",
                  })
              ),
            })
        );

        children.push(
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );

        children.push(new Paragraph({ spacing: { after: 200 } }));
        break;
      }

      case "spacer": {
        children.push(
          new Paragraph({
            spacing: { before: (item.height || 100) * 1.5, after: 0 },
            children: [],
          })
        );
        break;
      }

      case "line": {
        children.push(
          new Paragraph({
            border: {
              bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { after: 120 },
            children: [],
          })
        );
        break;
      }
    }
  }

  return children;
}

async function generateDocument() {
  const contentChildren = [];

  if (data.title) {
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: data.title, bold: true, size: 52 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
      })
    );
  }

  if (data.subtitle) {
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: data.subtitle, size: 32, color: "444444" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }

  if (data.date) {
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: data.date, size: 24, color: "888888" })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 300 },
      })
    );
  }

  contentChildren.push(...createContent(data.content));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,
            right: 1134,
            bottom: 1134,
            left: 1134,
          },
        },
      },
      children: contentChildren,
    }],
  });

  const buffer = await Packer.toBuffer(doc);

  const dir = dirname(outputPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, buffer);

  const sizeKB = (buffer.length / 1024).toFixed(2);
  console.log(`✅ Documento Word generado: ${outputPath} (${sizeKB} KB)`);
}

generateDocument().catch((err) => {
  console.error("Error generating document:", err.message);
  process.exit(1);
});
