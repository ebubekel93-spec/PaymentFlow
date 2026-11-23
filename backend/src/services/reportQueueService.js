'use strict';

const {
  startReportWorker,
  setJobProcessing,
  setJobCompleted,
  setJobFailed,
  createQueue,
  closeQueue,
} = require('../queue/reportQueue');
const {
  generateReport,
  generateAccountingCsv,
  reportToCsv,
} = require('./reportService');
const logger = require('../utils/logger');
const { storeReportArtifact } = require('./reportArtifactStorage');

async function processReportJob(job) {
  const { jobId, schoolId, type, startDate, endDate, timezone, schemaVersion, format = 'json' } = job.data;

  await setJobProcessing(jobId);
  logger.info('[ReportQueueService] Processing report job', { jobId, type, schoolId });

  try {
    const options = { schoolId, startDate, endDate, timezone };
    const isAccounting = type === 'accounting_csv';
    const accounting = isAccounting ? await generateAccountingCsv(options) : null;
    const report = isAccounting ? null : await generateReport(options);
    const isCsv = isAccounting || format === 'csv';
    const body = accounting?.csv ?? (isCsv ? reportToCsv(report) : JSON.stringify(report));
    const zone = (timezone || 'UTC').replaceAll('/', '-');
    const artifactKey = `reports/${jobId}-${zone}.${isCsv ? 'csv' : 'json'}`;
    await storeReportArtifact(artifactKey, body, isCsv ? 'text/csv' : 'application/json');
    await setJobCompleted(jobId, { artifactKey, schemaVersion: accounting?.schemaVersion || schemaVersion });
    return { success: true, jobId, type };
  } catch (err) {
    await setJobFailed(jobId, err);
    throw err;
  }
}

let worker = null;

function startWorker() {
  if (worker) return worker;
  createQueue();
  worker = startReportWorker(processReportJob);
  if (worker) {
    logger.info('[ReportQueueService] Report worker started');
  }
  return worker;
}

async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await closeQueue();
}

module.exports = {
  startWorker,
  stopWorker,
};