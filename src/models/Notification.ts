import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  subject: String,
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model('Notification', NotificationSchema);