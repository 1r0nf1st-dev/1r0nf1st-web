'use client';

import type { JSX, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { CorporateNav } from './CorporateNav';
import { CorporateFooter } from './CorporateFooter';
import { btnBase, btnPrimary } from '../../styles/buttons';
import { ApiError } from '../../apiClient';

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

export const CorporateContactPage = (): JSX.Element => {
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
        setSubmitError(
          err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form],
  );

  return (
    <div className="min-h-screen min-w-0 flex flex-col overflow-x-hidden">
      <CorporateNav />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight"
            style={{ letterSpacing: 'var(--letter-spacing-tight)' }}
          >
            CONTACT
          </h1>
          <p className="text-muted mb-6">
            We&apos;d love to help with any web projects you need. Get in contact with us.
          </p>
          <a
            href="#contact-form"
            className={`${btnBase} ${btnPrimary} inline-flex mb-10 px-8 py-4 text-lg min-h-[44px] transition-transform duration-200 hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background`}
            aria-label="Get in touch - scroll to contact form"
          >
            GET IN TOUCH
          </a>

          <div id="contact-form" className="scroll-mt-24">
            {success ? (
            <div className="rounded-xl border border-border bg-surface-soft/30 p-6">
              <p className="text-foreground">
                Thanks for your message. We&apos;ve received it and will get back to you soon. Check
                your email for a confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <div>
                <label htmlFor="corporate-contact-name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="corporate-contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-surface-soft px-3 py-3 min-h-[44px] text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'corporate-contact-name-error' : undefined}
                />
                {fieldErrors.name && (
                  <p
                    id="corporate-contact-name-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="corporate-contact-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="corporate-contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-surface-soft px-3 py-3 min-h-[44px] text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'corporate-contact-email-error' : undefined}
                />
                {fieldErrors.email && (
                  <p
                    id="corporate-contact-email-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="corporate-contact-message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  id="corporate-contact-message"
                  rows={4}
                  placeholder="Your message"
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="w-full rounded-xl border-2 border-border bg-surface-soft px-3 py-3 min-h-[100px] text-foreground placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y"
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={
                    fieldErrors.message ? 'corporate-contact-message-error' : undefined
                  }
                  maxLength={MESSAGE_MAX_LENGTH}
                />
                {fieldErrors.message && (
                  <p
                    id="corporate-contact-message-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
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
                className={`${btnBase} ${btnPrimary} self-start min-h-[44px] min-w-[44px]`}
                aria-busy={submitting}
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
          </div>
          </div>
        </div>
      </main>
      <CorporateFooter />
    </div>
  );
};
