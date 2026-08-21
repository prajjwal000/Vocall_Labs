const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/requireOrganizationMembership');
const SupportTicket = require('../models/SupportTicket');
const platformAdminService = require('../services/platformAdmin.service');

const router = express.Router();

router.use(authenticate);
router.use(requireOrganizationMembership);

// List organization's support tickets
router.get('/tickets', async (req, res, next) => {
  try {
    const organizationId = req.organization._id;
    const tickets = await SupportTicket.find({ organizationId })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
});

// Create new support ticket from customer workspace
router.post('/tickets', async (req, res, next) => {
  try {
    const organizationId = req.organization._id;
    const userId = req.user._id;
    const { subject, description, category, priority } = req.body;

    const ticket = await platformAdminService.createSupportTicket({
      organizationId,
      userId,
      user: req.user,
      subject,
      description,
      category,
      priority,
    });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Reply to own ticket from customer workspace
router.post('/tickets/:ticketId/reply', async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;
    const organizationId = req.organization._id;

    if (!text || !text.trim()) {
      const error = new Error('Message text is required');
      error.statusCode = 400;
      throw error;
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, organizationId });
    if (!ticket) {
      const error = new Error('Ticket not found');
      error.statusCode = 404;
      throw error;
    }

    ticket.messages.push({
      senderId: req.user._id,
      senderName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      senderType: 'user',
      text: text.trim(),
      createdAt: new Date(),
    });

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket,
      message: 'Reply sent',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
