/**
 * PDF to Markdown Conversion Utility
 * Converts PDF files to Markdown format with frontmatter
 */

class PDFConverter {
  constructor() {
    this.pdfLibReady = false;
  }

  /**
   * Initialize PDF.js
   */
  async initPdfLib() {
    if (this.pdfLibReady) return;

    // Note: PDF.js should be loaded via CDN in index.html
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"></script>

    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js library not loaded. Please add it to index.html');
    }

    // Set worker source
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    this.pdfLibReady = true;
  }

  /**
   * Extract text from PDF file
   */
  async extractTextFromPDF(file) {
    await this.initPdfLib();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const texts = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      texts.push(pageText);
    }

    return texts.join('\n\n');
  }

  /**
   * Convert PDF to Markdown with frontmatter
   */
  async pdfToMarkdown(file, metadata = {}) {
    try {
      const text = await this.extractTextFromPDF(file);

      // Create frontmatter
      const frontmatter = {
        title: metadata.title || file.name.replace(/\.pdf$/i, ''),
        author: metadata.author || 'Unknown',
        type: metadata.type || 'Fragment',
        mood: metadata.mood || ['Unspoken'],
        date: metadata.date || new Date().toISOString().split('T')[0],
        readTime: this.estimateReadTime(text),
        excerpt: metadata.excerpt || this.getExcerpt(text)
      };

      // Create markdown content
      const markdown = this.createMarkdown(frontmatter, text);
      return markdown;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  /**
   * Create markdown with frontmatter
   */
  createMarkdown(frontmatter, content) {
    const moodArray = Array.isArray(frontmatter.mood)
      ? frontmatter.mood
      : [frontmatter.mood];

    const frontmatterStr = `---
title: "${this.escapeMarkdown(frontmatter.title)}"
author: "${this.escapeMarkdown(frontmatter.author)}"
type: "${this.escapeMarkdown(frontmatter.type)}"
mood: [${moodArray.map(m => `"${this.escapeMarkdown(m)}"`).join(', ')}]
date: "${frontmatter.date}"
readTime: "${frontmatter.readTime}"
excerpt: "${this.escapeMarkdown(frontmatter.excerpt)}"
---

${content}`;

    return frontmatterStr;
  }

  /**
   * Estimate reading time
   */
  estimateReadTime(text) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return `${minutes} min read`;
  }

  /**
   * Get excerpt from text
   */
  getExcerpt(text, length = 170) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= length) return normalized;

    const trimmed = normalized.slice(0, length).trim();
    const lastBreak = Math.max(
      trimmed.lastIndexOf('. '),
      trimmed.lastIndexOf('? '),
      trimmed.lastIndexOf('! ')
    );

    return `${trimmed.slice(0, lastBreak > 120 ? lastBreak + 1 : trimmed.length).trim()}...`;
  }

  /**
   * Escape special markdown characters
   */
  escapeMarkdown(text) {
    return String(text)
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$');
  }
}

// Create global instance
const pdfConverter = new PDFConverter();
