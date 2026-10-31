export const feedbackRequestTypes = ['query', 'feedback', 'bug', 'business_enquiry'] as const;
export type FeedbackRequestType = (typeof feedbackRequestTypes)[number];

export interface FeedbackSubmission {
  name: string;
  email: string;
  phone: string | null;
  requestType: FeedbackRequestType;
  message: string;
}

type ValidationResult = { value: FeedbackSubmission; error?: never } | { value?: never; error: string };

const hasUnsupportedCharacters = (value: string) =>
  /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);

export function validateFeedbackSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') return { error: 'Complete each required field.' };

  const fields = input as Record<string, unknown>;
  if (typeof fields.name !== 'string' || typeof fields.email !== 'string'
    || typeof fields.requestType !== 'string' || typeof fields.message !== 'string'
    || (fields.phone !== undefined && fields.phone !== null && typeof fields.phone !== 'string')) {
    return { error: 'Complete each required field.' };
  }

  const name = fields.name.trim();
  const email = fields.email.trim().toLowerCase();
  const phone = typeof fields.phone === 'string' ? fields.phone.trim() : '';
  const message = fields.message.trim();
  const requestType = fields.requestType;

  if (name.length < 1 || name.length > 100 || hasUnsupportedCharacters(name)) {
    return { error: 'Enter a name of 1 to 100 characters without markup.' };
  }
  if (email.length > 320 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (phone.length > 40 || (phone && !/^[+()0-9 .-]+$/.test(phone))) {
    return { error: 'Enter a valid phone number or leave the field blank.' };
  }
  if (!feedbackRequestTypes.includes(requestType as FeedbackRequestType)) {
    return { error: 'Choose a request type.' };
  }
  if (message.length < 10 || message.length > 4000 || hasUnsupportedCharacters(message)) {
    return { error: 'Write 10 to 4,000 characters using plain text.' };
  }

  return {
    value: {
      name,
      email,
      phone: phone || null,
      requestType: requestType as FeedbackRequestType,
      message,
    },
  };
}

export function validateFeedbackResponse(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const response = input.trim();
  if (!response || response.length > 5000 || hasUnsupportedCharacters(response)) return null;
  return response;
}