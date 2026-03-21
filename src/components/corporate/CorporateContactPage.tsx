'use client';

import type { JSX, FormEvent } from 'react';
import { useState, useCallback } from 'react';
import { ApiError } from '../../apiClient';
import { PublicPageShell } from '../PublicPageShell';

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
    <PublicPageShell
      hero={{
        flagLabel: 'Get In Touch',
        watermark: "Let's Build",
        title: (
          <>
            Let&apos;s <em>Build</em> Something.
          </>
        ),
        subtitle:
          "We'd love to help with any web projects you need. Get in contact and let's talk.",
        primaryBtn: { label: 'Get In Touch', href: '#contact-form' },
        secondaryBtn: { label: 'View Projects', href: '/projects' },
      }}
    >
      <div className="contact-grid">
        <div id="contact-form" className="scroll-mt-24">
          {success ? (
            <div className="content-panel">
              <p className="font-display text-[13px] leading-[1.75] text-[color:var(--color-text-inv-2)]">
                Thanks for your message. We&apos;ve received it and will get back to you soon. Check
                your email for a confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
              <div className="field-group">
                <label htmlFor="corporate-contact-name" className="field-label">
                  Name
                </label>
                <input
                  id="corporate-contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="field-input"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'corporate-contact-name-error' : undefined}
                />
                {fieldErrors.name ? (
                  <p
                    id="corporate-contact-name-error"
                    className="mt-1 font-display text-[12px] text-[color:var(--color-orange)]"
                    role="alert"
                  >
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="field-group">
                <label htmlFor="corporate-contact-email" className="field-label">
                  Email
                </label>
                <input
                  id="corporate-contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="field-input"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'corporate-contact-email-error' : undefined}
                />
                {fieldErrors.email ? (
                  <p
                    id="corporate-contact-email-error"
                    className="mt-1 font-display text-[12px] text-[color:var(--color-orange)]"
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div className="field-group">
                <label htmlFor="corporate-contact-message" className="field-label">
                  Message
                </label>
                <textarea
                  id="corporate-contact-message"
                  rows={4}
                  placeholder="Your message"
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="field-input"
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={
                    fieldErrors.message ? 'corporate-contact-message-error' : undefined
                  }
                  maxLength={MESSAGE_MAX_LENGTH}
                />
                {fieldErrors.message ? (
                  <p
                    id="corporate-contact-message-error"
                    className="mt-1 font-display text-[12px] text-[color:var(--color-orange)]"
                    role="alert"
                  >
                    {fieldErrors.message}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <p
                  className="mb-4 font-display text-[12px] text-[color:var(--color-orange)]"
                  role="alert"
                >
                  {submitError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="contact-submit"
                aria-busy={submitting}
              >
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        <div>
          <div className="info-block">
            <h2 className="info-title">What We Do</h2>
            <div className="info-text">
              We build focused web applications and tools — from Second Brain platforms to
              AI-powered pipelines. Every project engineered with precision.
            </div>
          </div>

          <div className="info-block">
            <h2 className="info-title">Response Time</h2>
            <div className="info-text">
              We aim to respond to all enquiries within 24 hours.
            </div>
          </div>

          <div className="info-block" style={{ marginBottom: 0 }}>
            <h2 className="info-title">Stack</h2>
            <div className="info-text">
              Next.js · React · TypeScript · Supabase · Kubernetes · Playwright
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
};
