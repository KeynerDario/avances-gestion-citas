import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync, readFileSync, statSync } from "fs";
import { dirname } from "path";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: node generate-pdf.js <output-path> '<json-data>'");
  console.error("       node generate-pdf.js <output-path> --file <json-file>");
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

function generatePDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 60,
      bufferPages: true,
      info: {
        Title: data.title || "Document",
        Author: "Generate Documents Skill",
      },
    });

    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });

    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - 100;

    if (data.title) {
      doc.fontSize(28).font("Helvetica-Bold").text(data.title, { align: "center" });
      doc.moveDown(0.8);
    }

    if (data.subtitle) {
      doc.fontSize(16).font("Helvetica").fillColor("#444444").text(data.subtitle, { align: "center" });
      doc.moveDown(0.5);
    }

    if (data.date) {
      doc.fontSize(12).font("Helvetica").fillColor("#888888").text(data.date, { align: "right" });
      doc.moveDown(1.2);
    }

    doc.fillColor("#000000");

    for (const item of data.content || []) {
      switch (item.type) {
        case "heading": {
          const sizes = { 1: 24, 2: 19, 3: 17, 4: 15, 5: 13, 6: 12 };
          doc
            .fontSize(sizes[item.level] || 19)
            .font("Helvetica-Bold")
            .text(item.text || "", { underline: item.level <= 2, lineGap: 3 });
          doc.moveDown(0.8);
          doc.fillColor("#000000");
          break;
        }

        case "paragraph": {
          const fontSize = 13;
          doc.fontSize(fontSize).font(item.bold ? "Helvetica-Bold" : "Helvetica");

          if (item.italic) {
            doc.font("Helvetica-Oblique");
          }

          doc.text(item.text || "", {
            align: item.alignment || "justify",
            lineGap: 3,
            paragraphGap: 6,
          });
          doc.moveDown(0.7);
          doc.fillColor("#000000");
          break;
        }

        case "list": {
          doc.fontSize(13).font("Helvetica");
          for (const listItem of item.items || []) {
            doc.text(`• ${listItem}`, { indent: 20, lineGap: 3, paragraphGap: 4 });
            doc.moveDown(0.3);
          }
          doc.moveDown(0.5);
          break;
        }

        case "table": {
          const headers = item.headers || [];
          const rows = item.rows || [];
          const colWidth = pageWidth / headers.length;
          const rowHeight = 30;

          doc.fontSize(11).font("Helvetica-Bold");

          let y = doc.y;
          let x = 60;

          doc.rect(x, y, pageWidth, rowHeight).fill("#2B579A");
          doc.fillColor("#FFFFFF");

          for (const header of headers) {
            doc.font("Helvetica-Bold").text(header, x + 5, y + 9, {
              width: colWidth - 10,
              align: "center",
            });
            x += colWidth;
          }

          y += rowHeight;

          doc.fillColor("#000000");
          doc.font("Helvetica");

          for (const row of rows) {
            if (y + rowHeight > doc.page.height - 60) {
              doc.addPage();
              y = 60;

              x = 60;
              doc.rect(x, y, pageWidth, rowHeight).fill("#2B579A");
              doc.fillColor("#FFFFFF");
              doc.font("Helvetica-Bold");
              for (const header of headers) {
                doc.text(header, x + 5, y + 9, {
                  width: colWidth - 10,
                  align: "center",
                });
                x += colWidth;
              }
              y += rowHeight;
              doc.fillColor("#000000");
              doc.font("Helvetica");
            }

            x = 60;

            const isEvenRow = rows.indexOf(row) % 2 === 0;
            if (isEvenRow) {
              doc.save();
              doc.rect(x, y, pageWidth, rowHeight).fill("#F5F5F5");
              doc.restore();
              doc.fillColor("#000000");
            }

            doc.rect(x, y, pageWidth, rowHeight).stroke();

            for (const cell of row) {
              doc.text(cell || "", x + 5, y + 9, {
                width: colWidth - 10,
                align: "left",
              });
              x += colWidth;
            }
            y += rowHeight;
          }

          doc.y = y + 15;
          doc.x = 60;
          doc.moveDown(0.8);
          break;
        }

        case "spacer": {
          doc.moveDown((item.height || 20) / 20);
          break;
        }

        case "line": {
          const currentY = doc.y;
          doc
            .moveTo(60, currentY)
            .lineTo(60 + pageWidth, currentY)
            .stroke();
          doc.moveDown(0.8);
          break;
        }
      }
    }

    doc.end();

    doc.on("end", () => {
      stream.end(() => {
        const stats = statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ Documento PDF generado: ${outputPath} (${sizeKB} KB)`);
        resolve();
      });
    });

    doc.on("error", reject);
  });
}

generatePDF().catch((err) => {
  console.error("Error generating PDF:", err.message);
  process.exit(1);
});
