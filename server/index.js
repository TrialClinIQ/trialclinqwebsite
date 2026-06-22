'use strict';

const express = require('express');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Adapter: converts Express req to Netlify event format
function toNetlifyEvent(req) {
  return {
    httpMethod: req.method,
    path: req.path,
    queryStringParameters: req.query || {},
    headers: req.headers || {},
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
  };
}

// Adapter: sends Netlify handler response via Express res
function sendNetlifyResponse(res, result) {
  if (!result) {
    res.status(500).json({ error: 'No response from handler' });
    return;
  }
  const { statusCode = 200, headers = {}, body = '' } = result;
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.status(statusCode).send(body);
}

// Helper to mount a handler at a path
function mount(app, path, handlerModule) {
  app.all(path, async (req, res) => {
    try {
      const event = toNetlifyEvent(req);
      event.path = req.path; // preserve full path for sub-routing
      const result = await handlerModule.handler(event);
      sendNetlifyResponse(res, result);
    } catch (err) {
      console.error(`Error in handler for ${path}:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// Load handlers
const authHandler          = require('../api/netlify/functions/auth.js');
const analyticsHandler     = require('../api/netlify/functions/analytics.js');
const appointmentsHandler  = require('../api/netlify/functions/appointments.js');
const aiMatchingHandler    = require('../api/netlify/functions/ai-matching.js');
const aiScorerHandler      = require('../api/netlify/functions/ai-scorer.js');
const bookDemoHandler      = require('../api/netlify/functions/book-demo.js');
const requestAccessHandler = require('../api/netlify/functions/request-access.js');
const csrfTokenHandler     = require('../api/netlify/functions/csrf-token.js');
const ctgovHandler         = require('../api/netlify/functions/ctgov.js');
const customPatientsHandler= require('../api/netlify/functions/custom-patients.js');
const customTrialsHandler  = require('../api/netlify/functions/custom-trials.js');
const elationHandler       = require('../api/netlify/functions/elation.js');
const epicAuthUrlHandler   = require('../api/netlify/functions/epic-auth-url.js');
const epicTokenHandler     = require('../api/netlify/functions/epic-token-exchange.js');
const expressInterestHandler = require('../api/netlify/functions/express-interest.js');
const geocodeHandler       = require('../api/netlify/functions/geocode.js');
const getPatientFilesHandler = require('../api/netlify/functions/get-patient-files.js');
const getTrialInterestsHandler = require('../api/netlify/functions/get-trial-interests.js');
const messagesHandler      = require('../api/netlify/functions/messages.js');
const patientPipelineHandler = require('../api/netlify/functions/patient-pipeline.js');
const profileWriteHandler  = require('../api/netlify/functions/profile-write.js');
const providerTrialsHandler= require('../api/netlify/functions/provider-trials.js');
const providerWriteHandler = require('../api/netlify/functions/provider-write.js');
const siteMembersHandler   = require('../api/netlify/functions/site-members.js');
const summarizeHandler     = require('../api/netlify/functions/summarize.js');
const uploadFileHandler    = require('../api/netlify/functions/upload-file.js');
const userDataHandler      = require('../api/netlify/functions/user-data.js');
const whoamiHandler        = require('../api/netlify/functions/whoami.js');

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mount handlers — order matters: specific paths before wildcards
mount(app, '/api/auth', authHandler);

mount(app, '/api/analytics',   analyticsHandler);
mount(app, '/api/analytics/*', analyticsHandler);

mount(app, '/api/appointments',   appointmentsHandler);
mount(app, '/api/appointments/*', appointmentsHandler);

mount(app, '/api/ai-matching', aiMatchingHandler);
mount(app, '/api/ai-scorer',   aiScorerHandler);
mount(app, '/api/book-demo',      bookDemoHandler);
mount(app, '/api/request-access', requestAccessHandler);
mount(app, '/api/csrf-token',  csrfTokenHandler);

mount(app, '/api/ctgov',   ctgovHandler);
mount(app, '/api/ctgov/*', ctgovHandler);

mount(app, '/api/custom-patients',   customPatientsHandler);
mount(app, '/api/custom-patients/*', customPatientsHandler);

mount(app, '/api/custom-trials',   customTrialsHandler);
mount(app, '/api/custom-trials/*', customTrialsHandler);

mount(app, '/api/elation',   elationHandler);
mount(app, '/api/elation/*', elationHandler);

mount(app, '/api/epic-auth-url',        epicAuthUrlHandler);
mount(app, '/api/epic-token-exchange',  epicTokenHandler);
mount(app, '/api/express-interest',     expressInterestHandler);
mount(app, '/api/geocode',              geocodeHandler);

mount(app, '/api/get-patient-files',   getPatientFilesHandler);
mount(app, '/api/get-patient-files/*', getPatientFilesHandler);

mount(app, '/api/get-trial-interests', getTrialInterestsHandler);

mount(app, '/api/messages',   messagesHandler);
mount(app, '/api/messages/*', messagesHandler);

mount(app, '/api/patient-pipeline',   patientPipelineHandler);
mount(app, '/api/patient-pipeline/*', patientPipelineHandler);

mount(app, '/api/profile-write',   profileWriteHandler);
mount(app, '/api/profile-write/*', profileWriteHandler);

mount(app, '/api/provider-trials',   providerTrialsHandler);
mount(app, '/api/provider-trials/*', providerTrialsHandler);

mount(app, '/api/provider-write',   providerWriteHandler);
mount(app, '/api/provider-write/*', providerWriteHandler);

mount(app, '/api/site-members',   siteMembersHandler);
mount(app, '/api/site-members/*', siteMembersHandler);

mount(app, '/api/summarize',    summarizeHandler);
mount(app, '/api/upload-file',  uploadFileHandler);

mount(app, '/api/user-data',   userDataHandler);
mount(app, '/api/user-data/*', userDataHandler);

mount(app, '/api/whoami', whoamiHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`TrialClinIQ API running on port ${PORT}`));
