/* routes/upload.js ───────────────────────────────────────── */
'use strict';

const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const { Case, Extraction, ActionPlan, QueueItem } = require('../models');
const { authenticate }   = require('../middleware/auth');
const { upload }         = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

/* ══════════════════════════════════════════════════════════
   POST /api/upload/judgment
   Upload a court order PDF + metadata, trigger AI extraction
══════════════════════════════════════════════════════════ */
router.post('/judgment',
  upload.single('document'),    // field name must be "document"
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No document file uploaded.' });
      }

      // Basic metadata from form fields
      const {
        caseNo, dateOfOrder, department, nature,
        petitioner, respondent, court, bench,
        disposal, limitationPeriod, actionType,
      } = req.body;

      if (!caseNo || !dateOfOrder || !department || !petitioner || !respondent || !court) {
        // Remove uploaded file to avoid orphans
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'Missing required case fields.' });
      }

      // Check for duplicate case number
      const existing = await Case.findOne({ where: { caseNo } });
      if (existing) {
        fs.unlinkSync(req.file.path);
        return res.status(409).json({
          success: false,
          message: `Case ${caseNo} already exists in the system.`,
        });
      }

      // Create the case record
      const newCase = await Case.create({
        caseNo,
        dateOfOrder,
        department,
        nature:          nature || 'General',
        petitioner,
        respondent,
        court,
        bench:           bench           || null,
        disposal:        disposal        || null,
        limitationPeriod: limitationPeriod || null,
        actionType:      actionType      || 'none',
        documentPath:    req.file.filename,
        status:          'uploaded',
        uploadedBy:      req.user.id,
      });

      // ── Kick off async AI extraction ──────────────────────
      // In production this would publish to a job queue (Bull, SQS, etc.)
      // Here we run it detached so the HTTP response is instant.
      triggerExtractionAsync(newCase.id, req.file.path, req.user.id)
        .catch(err => console.error('[EXTRACTION ERROR]', err));

      res.status(201).json({
        success: true,
        message: 'Judgment uploaded. AI extraction started.',
        data: {
          caseId:   newCase.id,
          caseNo:   newCase.caseNo,
          status:   newCase.status,
          fileName: req.file.filename,
        },
      });
    } catch (err) { next(err); }
  }
);

/* ══════════════════════════════════════════════════════════
   GET /api/upload/status/:caseId
   Poll extraction progress
══════════════════════════════════════════════════════════ */
router.get('/status/:caseId', async (req, res, next) => {
  try {
    const c = await Case.findByPk(req.params.caseId, {
      attributes: ['id', 'caseNo', 'status', 'aiScore'],
    });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found.' });

    res.json({ success: true, data: c });
  } catch (err) { next(err); }
});

/* ══════════════════════════════════════════════════════════
   GET /api/upload/document/:filename
   Serve the uploaded PDF back to the client
══════════════════════════════════════════════════════════ */
router.get('/document/:filename', (req, res, next) => {
  try {
    const { UPLOAD_DIR } = require('../middleware/upload');
    const filePath = path.join(UPLOAD_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Security: ensure path stays inside UPLOAD_DIR
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    res.sendFile(resolved);
  } catch (err) { next(err); }
});

/* ── Internal async extraction trigger ───────────────── */
async function triggerExtractionAsync(caseId, filePath, userId) {
  // 1. Mark case as processing
  await Case.update({ status: 'processing' }, { where: { id: caseId } });

  try {
    // 2. Call AI extraction service
    //    In production: send filePath to your OCR + LLM pipeline.
    //    Here we simulate the result structure the frontend expects.
    const aiResult = await callAIExtractionService(filePath);

    // 3. Save extraction
    const extraction = await Extraction.create({
      caseId,
      caseDetails:  aiResult.caseDetails,
      parties:      aiResult.parties,
      directions:   aiResult.directions,
      timelines:    aiResult.timelines,
      confidence:   aiResult.confidence,
      modelVersion: aiResult.modelVersion,
      rawText:      aiResult.rawText,
      editsLog:     [],
    });

    // 4. Generate action plan
    const plan = generateActionPlan(aiResult);
    const actionPlan = await ActionPlan.create({
      caseId,
      ...plan,
      isPublished: false,
    });

    // 5. Add to verification queue
    const c = await Case.findByPk(caseId);
    await QueueItem.create({
      caseId,
      caseNo:       c.caseNo,
      description:  `${c.nature} — ${c.department}`,
      confidence:   aiResult.confidence,
      status:       'pending',
      extractionId: extraction.id,
      actionPlanId: actionPlan.id,
    });

    // 6. Update case status
    await Case.update(
      { status: 'pending_verification', aiScore: aiResult.confidence },
      { where: { id: caseId } }
    );

    console.log(`✅  Extraction complete for case ${caseId}`);
  } catch (err) {
    // Mark as failed but don't crash the server
    await Case.update({ status: 'uploaded' }, { where: { id: caseId } });
    throw err;
  }
}

/**
 * callAIExtractionService — stub that returns a mock AI result.
 * In production: POST the PDF to your AI service and return structured JSON.
 */
async function callAIExtractionService(_filePath) {
  // Simulate processing delay
  await new Promise(r => setTimeout(r, 1500));

  return {
    confidence:   88,
    modelVersion: 'ccms-extract-v2',
    rawText:      '(extracted text would appear here)',
    caseDetails:  [
      { label: 'Case Number',   value: 'AUTO-EXTRACTED' },
      { label: 'Court',         value: 'Auto-detected Court Name' },
      { label: 'Date of Order', value: new Date().toLocaleDateString('en-IN') },
    ],
    parties: [
      { role: 'Petitioner',  name: 'Auto-detected Petitioner', tag: 'Petitioner' },
      { role: 'Respondent 1', name: 'Auto-detected Respondent', tag: 'Respondent' },
    ],
    directions: [
      { text: 'Direction extracted from order text.', type: 'important', tag: 'Important' },
    ],
    timelines: [
      { event: 'Compliance Due', date: '30 days from order', daysLeft: '30 days', urgency: 'amber' },
    ],
  };
}

/**
 * generateActionPlan — derives a recommended action plan from AI extraction.
 */
function generateActionPlan(aiResult) {
  const hasCritical = aiResult.directions.some(d => d.type === 'critical');
  return {
    recommendation: hasCritical ? 'COMPLY WITH ORDER' : 'REVIEW & RESPOND',
    emoji:          hasCritical ? '⚖️' : '🔍',
    reason:         hasCritical
      ? 'Critical court directions detected — immediate compliance required.'
      : 'Order reviewed — standard response timeline applies.',
    confidence: aiResult.confidence,
    actions: [
      { title: 'Review Order', desc: 'Legal cell to review extracted directions.', priority: 'urgent', icon: '📋', tags: ['Immediate'], bg: '#fef2f2' },
      { title: 'Prepare Response', desc: 'Draft compliance / response document.', priority: 'high', icon: '📝', tags: ['Legal Cell'], bg: '#fffbeb' },
    ],
    timeline: [
      { day: 'Day 0',  title: 'Order Received',  desc: 'Judgment uploaded and extracted', state: 'done',   date: new Date().toLocaleDateString('en-IN') },
      { day: 'Day 5',  title: 'Internal Review', desc: 'Legal cell reviews implications', state: 'active', date: '' },
      { day: 'Day 30', title: 'Submit Response', desc: 'File compliance / appeal',        state: '',       date: '' },
    ],
    departments: [
      { abbr: 'LC', name: 'Legal Cell',  role: 'Primary review and drafting', badge: 'primary' },
      { abbr: 'LD', name: 'Law Dept',   role: 'Advisory on legal options',   badge: 'support'  },
    ],
    risks: [
      { level: 'HIGH', title: 'Deadline Risk', desc: 'Timely action required to avoid contempt.', cls: 'h' },
    ],
  };
}

module.exports = router;