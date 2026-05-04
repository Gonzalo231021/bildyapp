import PDFDocument from 'pdfkit';
import https from 'node:https';
import http from 'node:http';

const fetchImageBuffer = (url) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
};

const buildPdf = (doc, deliveryNote, signatureBuffer) => {
    // Cabecera
    doc.fontSize(20).font('Helvetica-Bold').text('ALBARÁN DE OBRA', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Fecha: ${new Date(deliveryNote.workdate || deliveryNote.createdAt).toLocaleDateString('es-ES')}`, { align: 'right' });
    doc.moveDown(1);

    // Datos del cliente
    doc.fontSize(12).font('Helvetica-Bold').text('Cliente');
    doc.fontSize(10).font('Helvetica');
    if (deliveryNote.client?.name)  doc.text(`Nombre: ${deliveryNote.client.name}`);
    if (deliveryNote.client?.cif)   doc.text(`CIF: ${deliveryNote.client.cif}`);
    if (deliveryNote.client?.email) doc.text(`Email: ${deliveryNote.client.email}`);
    doc.moveDown(0.8);

    // Datos del proyecto
    doc.fontSize(12).font('Helvetica-Bold').text('Proyecto');
    doc.fontSize(10).font('Helvetica');
    if (deliveryNote.project?.name)        doc.text(`Nombre: ${deliveryNote.project.name}`);
    if (deliveryNote.project?.projectCode) doc.text(`Código: ${deliveryNote.project.projectCode}`);
    doc.moveDown(0.8);

    // Detalle del trabajo
    doc.fontSize(12).font('Helvetica-Bold').text('Detalle');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Formato: ${deliveryNote.format === 'hours' ? 'Horas' : 'Material'}`);

    if (deliveryNote.format === 'hours') {
        doc.text(`Horas trabajadas: ${deliveryNote.hours ?? 0}`);
        if (deliveryNote.workers?.length) {
            doc.moveDown(0.4);
            doc.font('Helvetica-Bold').text('Trabajadores:');
            doc.font('Helvetica');
            deliveryNote.workers.forEach((w) => {
                doc.text(`  • ${w.name || 'Sin nombre'}: ${w.hours ?? 0} h`);
            });
        }
    } else {
        doc.text(`Material: ${deliveryNote.material || '-'}`);
    }

    if (deliveryNote.description) {
        doc.moveDown(0.4);
        doc.text(`Descripción: ${deliveryNote.description}`);
    }

    doc.moveDown(1.5);

    // Firma
    if (deliveryNote.signed && signatureBuffer) {
        doc.fontSize(12).font('Helvetica-Bold').text('Firma del cliente');
        doc.moveDown(0.4);
        doc.image(signatureBuffer, { width: 150 });
    } else if (deliveryNote.signed) {
        doc.fontSize(10).font('Helvetica').text('[Firma registrada]');
    } else {
        doc.fontSize(10).font('Helvetica').fillColor('grey').text('Pendiente de firma');
    }

    doc.end();
};

export const generateDeliveryNotePdf = async (deliveryNote) => {
    let signatureBuffer = null;
    if (deliveryNote.signed && deliveryNote.signatureUrl) {
        try {
            signatureBuffer = await fetchImageBuffer(deliveryNote.signatureUrl);
        } catch {
            // Si falla la descarga de la firma, continuamos sin ella
        }
    }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        buildPdf(doc, deliveryNote, signatureBuffer);
    });
};
