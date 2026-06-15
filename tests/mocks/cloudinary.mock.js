/**
 * Sets up Cloudinary mocks. Call this in test files that test upload routes.
 * Mocks the uploadBufferToCloudinary function and cloudinary.uploader.destroy.
 */

const mockUploadResult = {
  secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test-folder/test-image.jpg',
  public_id: 'test-folder/test-image',
  url: 'http://res.cloudinary.com/test-cloud/image/upload/v1/test-folder/test-image.jpg',
  format: 'jpg',
  width: 800,
  height: 600,
};

/**
 * Creates a jest mock module for `../../routes/upload/cloudinary.js`.
 * Must be called with jest.unstable_mockModule before importing the app.
 *
 * Usage in test file:
 * ```js
 * import { setupCloudinaryMock } from '../mocks/cloudinary.mock.js';
 * const { mockUploadBuffer, mockDestroy } = setupCloudinaryMock();
 * const app = (await import('../../app.js')).default;
 * ```
 */
export function setupCloudinaryMock() {
  const mockUploadBuffer = jest.fn().mockResolvedValue(mockUploadResult);
  const mockDestroy = jest.fn().mockResolvedValue({ result: 'ok' });

  jest.unstable_mockModule('../../routes/upload/cloudinary.js', () => ({
    default: {
      config: jest.fn(),
      uploader: {
        destroy: mockDestroy,
        upload_stream: jest.fn(),
      },
    },
    uploadBufferToCloudinary: mockUploadBuffer,
    upload: {
      single: () => (req, res, next) => {
        // Simulate multer adding a file to req
        req.file = {
          fieldname: 'image',
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
          size: 1024,
        };
        next();
      },
      array: (fieldName, maxCount) => (req, res, next) => {
        // Simulate multer adding files to req
        req.files = [
          {
            fieldname: fieldName,
            originalname: 'test1.jpg',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('fake-image-data-1'),
            size: 1024,
          },
          {
            fieldname: fieldName,
            originalname: 'test2.jpg',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('fake-image-data-2'),
            size: 2048,
          },
        ];
        next();
      },
    },
  }));

  return { mockUploadBuffer, mockDestroy, mockUploadResult };
}

/**
 * Creates a multer mock that simulates "no file uploaded" for testing 400 cases.
 */
export function setupCloudinaryMockNoFile() {
  const mockUploadBuffer = jest.fn().mockResolvedValue(mockUploadResult);
  const mockDestroy = jest.fn().mockResolvedValue({ result: 'ok' });

  jest.unstable_mockModule('../../routes/upload/cloudinary.js', () => ({
    default: {
      config: jest.fn(),
      uploader: {
        destroy: mockDestroy,
        upload_stream: jest.fn(),
      },
    },
    uploadBufferToCloudinary: mockUploadBuffer,
    upload: {
      single: () => (req, res, next) => {
        // Don't attach file — simulates no file uploaded
        next();
      },
      array: () => (req, res, next) => {
        // Don't attach files
        req.files = [];
        next();
      },
    },
  }));

  return { mockUploadBuffer, mockDestroy };
}
