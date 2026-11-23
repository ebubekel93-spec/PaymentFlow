'use strict';

const express = require('express');
const router = express.Router();
const { requireVersion } = require('../middleware/optimisticLock');
const {
  createSchool,
  getAllSchools,
  getSchool,
  updateSchool,
  rotateStellarAddress,
  rotateWebhookSecret,
  deactivateSchool,
  deactivateSchoolEndpoint,
  activateSchool,
  registerWebhook,
  getSchoolSettings,
  updateSchoolSettings,
  clearSchoolSetting,
} = require('../controllers/schoolController');
const { requireAdminAuth } = require('../middleware/auth');
const { auditContext } = require('../middleware/auditContext');

// Public read endpoints
router.get('/',                 getAllSchools);
router.get('/:schoolSlug',        getSchool);

// Admin-only write endpoints — require JWT auth
router.post('/',                requireAdminAuth, auditContext, createSchool);
router.patch('/:schoolId',      requireAdminAuth, auditContext, requireVersion, updateSchool);
router.delete('/:schoolSlug',     requireAdminAuth, auditContext, deactivateSchool);

// Dedicated wallet-rotation endpoint — step-up auth + mandatory reason (#1387)
router.put('/:schoolId/stellar-address', requireAdminAuth, auditContext, rotateStellarAddress);

// Dedicated webhookSecret rotation endpoint — step-up auth (#1412)
router.put('/:schoolId/webhook-secret', requireAdminAuth, auditContext, rotateWebhookSecret);

// Explicit activate / deactivate endpoints
router.patch('/:schoolSlug/deactivate', requireAdminAuth, auditContext, deactivateSchoolEndpoint);
router.patch('/:schoolSlug/activate',   requireAdminAuth, auditContext, activateSchool);

// Webhook registration — validates URL for SSRF safety before storing
router.post('/:slug/webhooks', requireAdminAuth, auditContext, registerWebhook);

// Per-school settings overrides
router.get('/:schoolSlug/settings',     requireAdminAuth, auditContext, getSchoolSettings);
router.patch('/:schoolSlug/settings',   requireAdminAuth, auditContext, updateSchoolSettings);
router.delete('/:schoolSlug/settings/:key', requireAdminAuth, auditContext, clearSchoolSetting);

module.exports = router;
