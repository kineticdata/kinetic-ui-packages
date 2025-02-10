export const resolvePromiseWith = response => (
  jest.fn(() => new Promise(resolve => setTimeout(() => resolve(response), 250)))
);

export const rejectPromiseWith = response => (
  jest.fn(() => new Promise((_, reject) => setTimeout(() => reject(response), 250)))
);
