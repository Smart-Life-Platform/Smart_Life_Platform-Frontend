import { messageFromPayload, errorText } from '../utils/errorMessage';

test('reads the error shapes Django REST Framework returns', () => {
  expect(messageFromPayload({ detail: 'Not found.' })).toBe('Not found.');
  expect(messageFromPayload({ error: { detail: 'Boom' } })).toBe('Boom');
  expect(messageFromPayload({ email: ['Enter a valid email.'] })).toBe('Enter a valid email.');
  expect(messageFromPayload({ error: ['First', 'Second'] })).toBe('First');
  expect(messageFromPayload({ non_field_errors: ['Something is off.'] })).toBe('Something is off.');
  expect(messageFromPayload('Plain text')).toBe('Plain text');
  expect(messageFromPayload('<html><body>500</body></html>')).toBe('');
  expect(messageFromPayload({})).toBe('');
  expect(messageFromPayload(null)).toBe('');
});

test('errorText never leaks "[object Object]" to the screen', () => {
  expect(errorText(new Error('[object Object]'), 'Fallback')).toBe('Fallback');
  expect(errorText({ message: '[object Object]' }, 'Fallback')).toBe('Fallback');
  expect(errorText(new Error('Real message'))).toBe('Real message');
  expect(errorText({ error: { detail: 'Server says no' } }, 'Fallback')).toBe('Server says no');
  expect(errorText(undefined, 'Fallback')).toBe('Fallback');
  expect(errorText('', 'Fallback')).toBe('Fallback');
});
