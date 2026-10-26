import type { MailTemplate } from './mail.service';

/** Realistic sample data for every email template; used by the preview page and the rendering test. */
export const MAIL_SAMPLES: Record<MailTemplate, Record<string, unknown>> = {
  newAdmin: {
    name: 'Priya Raman',
    email: 'priya@example.com',
    phone: '9876543210',
    password: 'Temp-Pass-2026',
    role: 'admin',
    loginUrl: 'https://admin.example.com/login',
  },
  passwordUpdated: { name: 'Priya Raman', email: 'priya@example.com', password: 'New-Pass-2026', loginUrl: 'https://admin.example.com/login' },
  passwordChanged: { name: 'Priya Raman', timestamp: '24/10/2026, 3:40 pm', resetUrl: 'https://admin.example.com/forgot-password' },
  adminDeleted: {
    name: 'Priya Raman',
    email: 'priya@example.com',
    role: 'admin',
    supportEmail: 'support@example.com',
    contactUrl: 'https://example.com/contact',
  },
  passwordReset: { resetLink: 'https://admin.example.com/reset-password/3f1c9b7e2a', expiresInMinutes: 10 },
  passwordSuccess: { timestamp: '24/10/2026, 3:40 pm', loginUrl: 'https://admin.example.com/login' },
  enquiry: {
    enquiryId: '8f14e45f-ceea-467f-a0e6-5a1c2b3d4e5f',
    name: 'Arun Kumar',
    email: 'arun@example.com',
    phone: '9123456780',
    company: 'Kumar Textiles',
    message: 'Hi, we need an e-commerce website with inventory sync.\nCould you share a quote and timeline?',
    timestamp: '24/10/2026, 3:40 pm',
    adminUrl: 'https://admin.example.com/enquiries',
  },
  enquiryUser: {
    name: 'Arun Kumar',
    message: 'Hi, we need an e-commerce website with inventory sync.\nCould you share a quote and timeline?',
    enquiryId: '8f14e45f-ceea-467f-a0e6-5a1c2b3d4e5f',
  },
  newsletter: { unsubscribeUrl: 'https://api.example.com/mec-api/news/unsubscribe?email=reader%40example.com&token=sample' },
  voucher: {
    title: 'Diwali Offer: 20% off website builds',
    heading: 'Valid until 15 November',
    message: 'Celebrate the festive season with 20% off any new website or app project.\nReply to this email to claim your voucher.',
    images: ['https://placehold.co/1072x560/2563eb/ffffff/png?text=Mecatronix'],
    websiteUrl: 'https://example.com',
    unsubscribeUrl: 'https://api.example.com/mec-api/news/unsubscribe?email=reader%40example.com&token=sample',
  },
  invoice: {
    invoice: {
      invoiceNo: 'INV-2026-014',
      clientName: 'Kumar Textiles',
      notes: 'Payment due within 15 days.',
      items: [
        { desc: 'E-commerce website', qty: 1, rate: 45000, amount: 45000 },
        { desc: 'Hosting (12 months)', qty: 1, rate: 6000, amount: 6000 },
      ],
    },
    invoiceDate: '2026-10-24',
    dueDate: '2026-11-08',
    total: '51,000.00',
  },
};
