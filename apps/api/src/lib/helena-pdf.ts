import { fileURLToPath } from 'node:url';
import type { HelenaDraft } from '@juliana/contracts';
import PDFDocument from 'pdfkit';

export const helenaPdfVersion = 'helena.pdf.v1';
const names: Record<string, string> = {
  sun: 'Sol',
  moon: 'Lua',
  mercury: 'Mercúrio',
  venus: 'Vênus',
  mars: 'Marte',
  jupiter: 'Júpiter',
  saturn: 'Saturno',
  uranus: 'Urano',
  neptune: 'Netuno',
  pluto: 'Plutão',
};
const signs = [
  'Áries',
  'Touro',
  'Gêmeos',
  'Câncer',
  'Leão',
  'Virgem',
  'Libra',
  'Escorpião',
  'Sagitário',
  'Capricórnio',
  'Aquário',
  'Peixes',
];
const position = (angle: number) => {
  const minutes = Math.round(angle * 60) % 21600;
  return `${Math.floor((minutes % 1800) / 60)}°${String(minutes % 60).padStart(2, '0')}' ${signs[Math.floor(minutes / 1800)]}`;
};

export const renderHelenaPdf = async (draft: HelenaDraft): Promise<Buffer> => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 80, bottom: 60, left: 46, right: 46 },
    bufferPages: true,
    info: {
      Title: `HELENA · ${draft.title}`,
      Author: 'Juliana Manduca',
      Creator: helenaPdfVersion,
      CreationDate: new Date(draft.updatedAt),
      ModDate: new Date(draft.updatedAt),
    },
  });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  try {
    doc.registerFont(
      'Body',
      fileURLToPath(import.meta.resolve('@fontsource/manrope/files/manrope-latin-400-normal.woff')),
    );
    doc.registerFont(
      'Heading',
      fileURLToPath(import.meta.resolve('@fontsource/manrope/files/manrope-latin-700-normal.woff')),
    );
    const width = doc.page.width - 92;
    const header = () => {
      doc
        .font('Heading')
        .fontSize(9)
        .fillColor('#6d5385')
        .text('JULIANA MANDUCA  /  HELENA', 46, 30, { lineBreak: false });
      doc
        .moveTo(46, 53)
        .lineTo(doc.page.width - 46, 53)
        .strokeColor('#d9c5ce')
        .stroke();
      doc.font('Body').fillColor('#38243a');
      doc.x = 46;
      doc.y = 80;
    };
    header();
    doc.on('pageAdded', header);
    const ensure = (height: number) => {
      if (doc.y + height > doc.page.height - 65) doc.addPage();
    };
    const heading = (text: string) => {
      ensure(50);
      doc.moveDown(0.6).font('Heading').fontSize(17).text(text, { width });
      doc.moveDown(0.5).font('Body').fontSize(10);
    };
    const row = (cells: string[], widths: number[]) => {
      const height = Math.max(
        24,
        ...cells.map(
          (cell, i) =>
            doc.heightOfString(cell, { width: (widths[i] ?? 100) - 12, lineGap: 2 }) + 12,
        ),
      );
      ensure(height);
      const top = doc.y;
      let x = 46;
      cells.forEach((cell, i) => {
        doc.text(cell, x + 4, top + 5, { width: (widths[i] ?? 100) - 12, lineGap: 2 });
        x += widths[i] ?? 100;
      });
      doc
        .moveTo(46, top + height)
        .lineTo(46 + width, top + height)
        .strokeColor('#e5d8de')
        .stroke();
      doc.x = 46;
      doc.y = top + height;
    };
    doc.font('Heading').fontSize(24).text(draft.title, { width });
    doc.moveDown(0.5).font('Body').fontSize(12).text(draft.subjectName, { width });
    const chart = draft.result;
    const input = chart.input;
    doc
      .moveDown(0.8)
      .fontSize(10)
      .text(
        `${input.date} · ${input.time} · UTC ${input.utcOffsetMinutes >= 0 ? '+' : ''}${input.utcOffsetMinutes} min`,
      );
    doc.text(`Latitude ${input.latitude}° · Longitude ${input.longitude}°`);
    const systems = { P: 'Placidus', K: 'Koch', E: 'Casas iguais', W: 'Signos inteiros' };
    const zodiacs = {
      tropical: 'Tropical',
      lahiri: 'Sidéreo Lahiri',
      fagan_bradley: 'Sidéreo Fagan–Bradley',
    };
    doc.text(
      `${systems[input.houseSystem]} · ${zodiacs[input.zodiac]} · Revisão ${draft.revision}`,
    );
    ensure(335);
    const cx = doc.page.width / 2,
      cy = doc.y + 164;
    const point = (angle: number, radius: number) => {
      const a = ((180 - angle + chart.ascendant) * Math.PI) / 180;
      return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)] as const;
    };
    doc.circle(cx, cy, 150).strokeColor('#6d5385').stroke();
    doc.circle(cx, cy, 121).stroke();
    doc.circle(cx, cy, 78).strokeColor('#d9c5ce').stroke();
    signs.forEach((sign, i) => {
      const a = point(i * 30, 121),
        b = point(i * 30, 150),
        label = point(i * 30 + 15, 136);
      doc
        .moveTo(...a)
        .lineTo(...b)
        .strokeColor('#d9c5ce')
        .stroke();
      doc
        .fontSize(6)
        .text(sign, label[0] - 24, label[1] - 4, { width: 48, align: 'center', lineBreak: false });
    });
    chart.houses.forEach((cusp, i) => {
      const a = point(cusp, 78),
        b = point(cusp, 121),
        next = chart.houses[(i + 1) % 12] ?? cusp;
      doc
        .moveTo(...a)
        .lineTo(...b)
        .strokeColor('#d9c5ce')
        .stroke();
      const label = point(cusp + ((next - cusp + 360) % 360) / 2, 86);
      doc.fontSize(7).text(String(i + 1), label[0] - 8, label[1] - 4, {
        width: 16,
        align: 'center',
        lineBreak: false,
      });
    });
    chart.aspects.forEach((aspect) => {
      const a = chart.bodies.find((body) => body.id === aspect.bodyA),
        b = chart.bodies.find((body) => body.id === aspect.bodyB);
      if (!a || !b) return;
      doc
        .moveTo(...point(a.longitude, 75))
        .lineTo(...point(b.longitude, 75))
        .lineWidth(0.4)
        .strokeColor([60, 120].includes(aspect.angle) ? '#6d5385' : '#9f5265')
        .stroke();
    });
    chart.bodies.forEach((body, i) => {
      const p = point(body.longitude, 75),
        label = point(body.longitude, i % 2 ? 103 : 116);
      doc.circle(p[0], p[1], 1.6).fillColor('#38243a').fill();
      doc.fontSize(6).text(names[body.id] ?? body.id, label[0] - 21, label[1] - 4, {
        width: 42,
        align: 'center',
        lineBreak: false,
      });
    });
    doc.x = 46;
    doc.y = cy + 160;
    doc.fontSize(10).fillColor('#38243a');
    doc.text(
      `Ascendente: ${position(chart.ascendant)} · Meio do Céu: ${position(chart.midheaven)}`,
    );
    doc
      .moveDown(0.5)
      .fontSize(8)
      .text(
        `Swiss Ephemeris ${chart.engine.version} / ${chart.ephemeris} · JD UT ${chart.julianDayUt.toFixed(6)}`,
      );
    doc.text(
      `Formato ${helenaPdfVersion}. Casas por intervalos eclípticos; fase de aspectos pelo movimento instantâneo.`,
    );
    doc.addPage();
    heading('Posições planetárias');
    row(['Corpo', 'Posição', 'Casa', 'Movimento'], [105, 210, 58, width - 373]);
    chart.bodies.forEach((body) =>
      row(
        [
          names[body.id] ?? body.id,
          position(body.longitude),
          String(body.house),
          body.retrograde ? 'Retrógrado' : 'Direto',
        ],
        [105, 210, 58, width - 373],
      ),
    );
    heading('Casas');
    chart.houses.forEach((cusp, i) => row([`Casa ${i + 1}`, position(cusp)], [110, width - 110]));
    heading('Aspectos maiores');
    const aspectNames = {
      conjunction: 'Conjunção',
      sextile: 'Sextil',
      square: 'Quadratura',
      trine: 'Trígono',
      opposition: 'Oposição',
    };
    const phases = { applying: 'Aplicativo', separating: 'Separativo', exact: 'Exato' };
    chart.aspects.forEach((aspect) =>
      row(
        [
          `${names[aspect.bodyA]} / ${names[aspect.bodyB]}`,
          aspectNames[aspect.type],
          `${aspect.orb.toFixed(2)}°`,
          phases[aspect.phase],
        ],
        [165, 120, 70, width - 355],
      ),
    );
    if (!chart.aspects.length) doc.text('Nenhum aspecto nos orbes definidos.');
    heading('Análise');
    doc
      .fontSize(11)
      .text(draft.analysis || 'Sem texto de análise nesta versão.', { width, lineGap: 4 });
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const bottomMargin = doc.page.margins.bottom;
      // The footer sits outside the body margin; keep PDFKit from flowing it onto a new page.
      doc.page.margins.bottom = 0;
      doc
        .font('Body')
        .fontSize(8)
        .fillColor('#6d5385')
        .text(
          `HELENA · Revisão ${draft.revision} · ${i + 1}/${range.count}`,
          46,
          doc.page.height - 35,
          { width, align: 'right', lineBreak: false },
        );
      doc.page.margins.bottom = bottomMargin;
    }
    doc.end();
  } catch (error) {
    if ('destroy' in doc && typeof doc.destroy === 'function') doc.destroy();
    throw error;
  }
  return done;
};
