import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate a PDF certificate for course completion
 * @param {string} studentName - Name of the student
 * @param {string} courseName - Name of the course
 * @param {Date} completionDate - Date of completion
 * @param {string} outputPath - Where to save the PDF
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export const generateCertificate = async (
  studentName,
  courseName,
  completionDate,
  outputPath,
  options = {}
) => {
  return new Promise((resolve, reject) => {
    try {
      // Create output directory if it doesn't exist
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const stream = fs.createWriteStream(outputPath);

      doc.on('end', () => {
        resolve();
      });

      doc.on('error', reject);
      stream.on('error', reject);

      doc.pipe(stream);

      // Set up fonts
      doc.fontSize(48).font('Helvetica-Bold');

      // Add border
      doc.strokeColor('#2c3e50').lineWidth(3);
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();

      // Inner decorative border
      doc.strokeColor('#3498db').lineWidth(1);
      doc.rect(60, 60, doc.page.width - 120, doc.page.height - 120).stroke();

      // Add gradient effect with shapes
      doc.fillColor('#ecf0f1').rect(65, 65, doc.page.width - 130, 120).fill();

      // Title
      doc.fontSize(48)
        .fillColor('#2c3e50')
        .font('Helvetica-Bold')
        .text('Certificate of Completion', 100, 100, {
          align: 'center',
          width: doc.page.width - 200
        });

      // Decorative line
      doc.strokeColor('#3498db').lineWidth(2);
      doc.moveTo(150, 220).lineTo(doc.page.width - 150, 220).stroke();

      // Main text
      doc.fontSize(16).fillColor('#34495e').font('Helvetica');
      doc.text('This is to certify that', 100, 260, { align: 'center' });

      doc.fontSize(32).fillColor('#2c3e50').font('Helvetica-Bold');
      doc.text(studentName, 100, 300, {
        align: 'center',
        width: doc.page.width - 200
      });

      // Recognition text
      doc.fontSize(14).fillColor('#34495e').font('Helvetica');
      doc.text('has successfully completed the course', 100, 380, { align: 'center' });

      doc.fontSize(24).fillColor('#27ae60').font('Helvetica-Bold');
      doc.text(courseName, 100, 420, {
        align: 'center',
        width: doc.page.width - 200
      });

      // Certificate body
      doc.fontSize(12).fillColor('#34495e').font('Helvetica');
      doc.text(
        'In recognition of the successful completion of the course and demonstrating ' +
        'proficiency in the subject matter, this certificate is awarded with distinction.',
        100,
        500,
        {
          align: 'center',
          width: doc.page.width - 200,
          lineGap: 5
        }
      );

      // Date section
      const formattedDate = completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(11).fillColor('#5d6d7b');
      doc.text('Awarded on:', 100, 580);
      doc.fontSize(14).fillColor('#2c3e50').font('Helvetica-Bold');
      doc.text(formattedDate, 100, 600);

      // Signature line
      doc.fontSize(10).fillColor('#5d6d7b').font('Helvetica');
      doc.moveTo(150, 680).lineTo(350, 680).stroke();
      doc.text('Authorized Signature', 150, 690, { align: 'center' });

      // Certificate number (optional)
      const certificateNumber = generateCertificateNumber();
      doc.fontSize(9).fillColor('#95a5a6');
      doc.text(`Certificate #: ${certificateNumber}`, 100, doc.page.height - 80);

      // Institution name (optional)
      doc.fontSize(12).fillColor('#2c3e50').font('Helvetica-Bold');
      doc.text('ScholarPath', 100, doc.page.height - 50, { align: 'center', width: doc.page.width - 200 });

      doc.fontSize(9).fillColor('#7f8c8d');
      doc.text('Online Learning Platform', 100, doc.page.height - 30, { align: 'center', width: doc.page.width - 200 });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a unique certificate number
 * Format: CERT-YYYY-XXXXX (where X is alphanumeric)
 * @returns {string}
 */
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${random}`;
};

/**
 * Check if a certificate file exists
 * @param {string} filePath - Path to certificate file
 * @returns {boolean}
 */
export const certificateExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * Delete a certificate file
 * @param {string} filePath - Path to certificate file
 * @returns {Promise<void>}
 */
export const deleteCertificate = async (filePath) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
};

/**
 * Batch generate certificates
 * @param {Array} enrollments - Array of enrollment objects with studentName, courseName, completionDate
 * @param {string} baseDir - Base directory for certificates
 * @returns {Promise<Array>}
 */
export const generateBatchCertificates = async (enrollments, baseDir) => {
  const results = [];

  for (const enrollment of enrollments) {
    try {
      const fileName = `${enrollment.id}-certificate.pdf`;
      const filePath = path.join(baseDir, fileName);

      await generateCertificate(
        enrollment.studentName,
        enrollment.courseName,
        enrollment.completionDate,
        filePath
      );

      results.push({
        success: true,
        enrollmentId: enrollment.id,
        filePath,
        message: 'Certificate generated successfully'
      });
    } catch (error) {
      results.push({
        success: false,
        enrollmentId: enrollment.id,
        error: error.message
      });
    }
  }

  return results;
};

export default {
  generateCertificate,
  certificateExists,
  deleteCertificate,
  generateBatchCertificates,
  generateCertificateNumber
};
