import { Router } from 'express';
import { z } from 'zod';
import { generateGuideRecord } from '../services/guideService.js';
import { analyzeSafety } from '../services/safetyService.js';
import { sanitizeText, validateSafeText } from '../utils/security.js';

const router = Router();
const guideStore: Record<string, any> = {};

const checklistSchema = z.object({
  completed: z.boolean(),
});

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'CareGuide API',
    },
  });
});

router.post('/guides/generate', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const input = {
      appointmentType: sanitizeText(payload.appointmentType),
      appointmentDate: sanitizeText(payload.appointmentDate),
      appointmentTime: sanitizeText(payload.appointmentTime),
      facilityName: sanitizeText(payload.facilityName),
      providerName: sanitizeText(payload.providerName),
      reasonForVisit: sanitizeText(payload.reasonForVisit),
      officialInstructions: sanitizeText(payload.officialInstructions),
      additionalNotes: sanitizeText(payload.additionalNotes),
    };

    if (
      !validateSafeText(input.appointmentType, 120) ||
      !validateSafeText(input.facilityName, 160) ||
      !validateSafeText(input.reasonForVisit, 500) ||
      (input.officialInstructions.length > 0 && !validateSafeText(input.officialInstructions, 4000)) ||
      (input.additionalNotes.length > 0 && !validateSafeText(input.additionalNotes, 1500))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please review the highlighted fields and provide valid appointment information.',
      });
    }

    const safety = analyzeSafety(`${input.reasonForVisit ?? ''} ${input.officialInstructions ?? ''} ${input.additionalNotes ?? ''}`);
    if (safety.emergency) {
      return res.status(400).json({
        success: false,
        message: 'If you believe you may be experiencing a medical emergency, seek immediate medical help or contact local emergency services.',
        safetyNotice: safety.safeResponse,
      });
    }

    const guide = await generateGuideRecord(input);
    guideStore[guide.id] = guide;

    return res.status(201).json({
      success: true,
      data: guide,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'We could not create your care guide.';
    return res.status(400).json({
      success: false,
      message,
    });
  }
});

router.get('/guides', (_req, res) => {
  const guides = Object.values(guideStore);
  res.json({
    success: true,
    data: guides,
  });
});

router.get('/guides/:id', (req, res) => {
  const guide = guideStore[req.params.id];
  if (!guide) {
    return res.status(404).json({
      success: false,
      message: 'Guide not found.',
    });
  }

  return res.json({
    success: true,
    data: guide,
  });
});

router.delete('/guides/:id', (req, res) => {
  const id = req.params.id;
  if (!guideStore[id]) {
    return res.status(404).json({
      success: false,
      message: 'Guide not found.',
    });
  }

  delete guideStore[id];
  return res.json({
    success: true,
    data: { deletedId: id },
  });
});

router.patch('/guides/:id/checklist/:itemId', (req, res) => {
  const guide = guideStore[req.params.id];
  if (!guide) {
    return res.status(404).json({
      success: false,
      message: 'Guide not found.',
    });
  }

  const parsed = checklistSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Checklist state is invalid.',
    });
  }

  const item = guide.checklist.find((entry: any) => entry.id === req.params.itemId);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Checklist item not found.',
    });
  }

  item.completed = parsed.data.completed;
  guide.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: guide,
  });
});

router.post('/ai/simplify', async (req, res) => {
  const text = req.body?.text ?? '';
  if (!text || !String(text).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a text block to simplify.',
    });
  }

  const safety = analyzeSafety(String(text));
  const summary = safety.emergency
    ? safety.safeResponse
    : `AI-assisted simplification: ${String(text).slice(0, 220)}${String(text).length > 220 ? '...' : ''}`;

  return res.json({
    success: true,
    data: {
      summary,
      safetyNotice: safety.safeResponse,
    },
  });
});

export default router;
