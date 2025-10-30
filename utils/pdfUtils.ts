import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from '@cantoo/pdf-lib';

export interface PDFInfo {
  isProtected: boolean;
  uri: string;
}

export interface PDFProcessResult {
  success: boolean;
  unprotectedUri?: string;
  base64Content?: string;
  error?: string;
}

/**
 * Check if a PDF file is password-protected
 */
export async function checkPDFProtection(uri: string): Promise<boolean> {
  try {
    // Read first few bytes to check for encryption
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to check for encryption markers
    const pdfContent = atob(base64);

    // Check for encryption dictionary markers in PDF
    const isEncrypted = pdfContent.includes('/Encrypt') || pdfContent.includes('/P ');

    return isEncrypted;
  } catch (error) {
    console.error('Error checking PDF protection:', error);
    return false;
  }
}

/**
 * Create an unprotected copy of a password-protected PDF using pdf-lib
 * This function decrypts the PDF using the provided password and returns base64 content
 */
export async function createUnprotectedPDF(
  sourceUri: string,
  password: string
): Promise<PDFProcessResult> {
  try {
    console.log('Attempting to decrypt PDF with password...');

    // Read the encrypted PDF file
    const encryptedBase64 = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const binaryString = atob(encryptedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Try to load the PDF with password using pdf-lib
    const pdfDoc = await PDFDocument.load(bytes, {
      password: password,
      ignoreEncryption: false,
    });

    console.log('PDF loaded successfully with password!');

    // Save the decrypted PDF
    const decryptedBytes = await pdfDoc.save();

    // Convert back to base64
    let binary = '';
    const len = decryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(decryptedBytes[i]);
    }
    const decryptedBase64 = btoa(binary);

    // Optionally save to temp file
    const timestamp = Date.now();
    const tempUri = `${FileSystem.cacheDirectory}temp_pdf_${timestamp}.pdf`;
    await FileSystem.writeAsStringAsync(tempUri, decryptedBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('PDF decrypted and saved successfully');

    return {
      success: true,
      unprotectedUri: tempUri,
      base64Content: decryptedBase64,
    };
  } catch (error) {
    console.error('Error decrypting PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decrypt PDF',
    };
  }
}

/**
 * Convert PDF to images for processing
 * This is useful for sending to Gemini API
 */
export async function convertPDFToImages(
  uri: string,
  password?: string
): Promise<string[]> {
  try {
    // For password-protected PDFs, create unprotected copy first
    let pdfUri = uri;
    if (password) {
      const result = await createUnprotectedPDF(uri, password);
      if (!result.success || !result.unprotectedUri) {
        throw new Error(result.error || 'Failed to decrypt PDF');
      }
      pdfUri = result.unprotectedUri;
    }

    // Note: Converting PDF to images requires native code
    // For now, we'll read the PDF as base64 to send to Gemini
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Clean up temp file if created
    if (password && pdfUri !== uri) {
      await cleanupTempPDF(pdfUri);
    }

    return [base64];
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw error;
  }
}

/**
 * Extract text from PDF
 */
export async function extractPDFText(
  uri: string,
  password?: string
): Promise<string> {
  try {
    let pdfUri = uri;

    // Handle password-protected PDFs
    if (password) {
      const result = await createUnprotectedPDF(uri, password);
      if (!result.success || !result.unprotectedUri) {
        throw new Error(result.error || 'Failed to decrypt PDF');
      }
      pdfUri = result.unprotectedUri;
    }

    // Read PDF content
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Clean up temp file if created
    if (password && pdfUri !== uri) {
      await cleanupTempPDF(pdfUri);
    }

    // Return base64 content (Gemini can process this)
    return base64;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Clean up temporary PDF files
 */
export async function cleanupTempPDF(uri: string): Promise<void> {
  try {
    // Just try to delete, if it fails it's probably already gone
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.error('Error cleaning up temp PDF:', error);
  }
}

/**
 * Validate PDF password
 */
export async function validatePDFPassword(
  uri: string,
  password: string
): Promise<boolean> {
  try {
    const result = await createUnprotectedPDF(uri, password);

    // Clean up if successful
    if (result.success && result.unprotectedUri) {
      await cleanupTempPDF(result.unprotectedUri);
    }

    return result.success;
  } catch (error) {
    return false;
  }
}
