import type { JSX, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { cardClasses, cardOverlay, cardTitle, cardBody } from '../styles/cards';
import { btnBase, btnPrimary } from '../styles/buttons';
import { ApiError } from '../apiClient';

const MESSAGE_MAX_LENGTH = 5000;
const NAME_MAX_LENGTH = 200;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FieldError {
  name?: string;
  email?: string;
  message?: string;
}

function validateForm(state: FormState): FieldError {
  const errors: FieldError = {};
  const nameTrim = state.name.trim();
  if (!nameTrim) {
    errors.name = 'Name is required.';
  } else if (nameTrim.length > NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  }
  const emailTrim = state.email.trim();
  if (!emailTrim) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(emailTrim)) {
    errors.email = 'Please enter a valid email address.';
  }
  const messageTrim = state.message.trim();
  if (!messageTrim) {
    errors.message = 'Message is required.';
  } else if (messageTrim.length > MESSAGE_MAX_LENGTH) {
    errors.message = `Message must be at most ${MESSAGE_MAX_LENGTH} characters.`;
  }
  return errors;
}

export const ContactUsCard = (): JSX.Element => {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const errors = validateForm(form);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setSubmitError(null);
      setSubmitting(true);
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            message: form.message.trim(),
          }),
        });
        const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
        if (!res.ok) {
          throw new ApiError(
            data.error ?? 'Something went wrong. Please try again.',
            res.status,
            '/api/contact',
          );
        }
        setSuccess(true);
        setForm({ name: '', email: '', message: '' });
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [form],
  );

  if (success) {
    return (
      <article className={cardClasses}>
        <div className={cardOverlay} aria-hidden />
        <h2 className={cardTitle}>Contact us</h2>
        <p className={cardBody}>
          Thanks for your message. We&apos;ve received it and will get back to you soon. Check your email for a
          confirmation.
        </p>
      </article>
    );
  }

  return (
    <article className={cardClasses}>
      <div className={cardOverlay} aria-hidden />
      <h2 className={cardTitle}>Contact us</h2>
      <p className={`${cardBody} mb-4`}>
        We&apos;d love to help with any web projects you need. Get in contact with us.
      </p>
      <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-3" noValidate>
        <div>
          <label htmlFor="contact-name" className="sr-only">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-lg border-2 border-primary/30 dark:border-border bg-white dark:bg-surface-soft px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="contact-name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full rounded-lg border-2 border-primary/30 dark:border-border bg-white dark:bg-surface-soft px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="contact-email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-message" className="sr-only">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={4}
            placeholder="Your message"
            value={form.message}
            onChange={(e) => handleChange('message', e.target.value)}
            className="w-full rounded-lg border-2 border-primary/30 dark:border-border bg-white dark:bg-surface-soft px-3 py-2 text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y min-h-[80px]"
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
            maxLength={MESSAGE_MAX_LENGTH}
          />
          {fieldErrors.message && (
            <p id="contact-message-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.message}
            </p>
          )}
        </div>
        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {submitError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`${btnBase} ${btnPrimary} self-start`}
          aria-busy={submitting}
        >
          {submitting ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </article>
  );
};
