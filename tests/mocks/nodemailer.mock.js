/**
 * Sets up Nodemailer mocks to prevent real email sending during tests.
 * Must be called with jest.unstable_mockModule before importing route modules.
 *
 * Usage:
 * ```js
 * import { setupNodemailerMock } from '../mocks/nodemailer.mock.js';
 * const { mockSendMail } = setupNodemailerMock();
 * ```
 */
export function setupNodemailerMock() {
  const mockSendMail = jest.fn().mockResolvedValue({
    messageId: '<test-message-id@campuspulse.local>',
    accepted: ['test@test.com'],
    rejected: [],
    response: '250 OK',
  });

  const mockTransporter = {
    sendMail: mockSendMail,
  };

  jest.unstable_mockModule('nodemailer', () => ({
    default: {
      createTransport: jest.fn().mockReturnValue(mockTransporter),
      createTestAccount: jest.fn().mockResolvedValue({
        user: 'test-user@ethereal.email',
        pass: 'test-password',
      }),
      getTestMessageUrl: jest.fn().mockReturnValue('https://ethereal.email/message/test-id'),
    },
  }));

  return { mockSendMail, mockTransporter };
}
