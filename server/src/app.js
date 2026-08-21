const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const path = require('path');

const app = express();

// Security & Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static Uploads Folder for Local / Cached Attachments
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/organizations', require('./routes/organization.routes'));
app.use('/api/invitations', require('./routes/invitation.routes').publicRouter);
app.use('/api/permissions', require('./routes/permission.routes'));
app.use('/api/admin', require('./routes/platform.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/workflows', require('./routes/workflow.routes'));
app.use('/api/forms', require('./routes/form.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/approvals', require('./routes/approval.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/storage', require('./routes/storage.routes'));
app.use('/api/support', require('./routes/support.routes'));

// Global Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
