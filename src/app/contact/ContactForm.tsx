"use client";

import { useState } from "react";
import { Field } from "@/components/Field";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate inquiry submission (or hook to notification webhook/email)
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="p-8 rounded-[28px] bg-surface border border-line-light text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-tint-sage text-brand flex items-center justify-center text-xl">
          ✓
        </div>
        <h3 className="text-2xl font-serif text-ink m-0">Message received!</h3>
        <p className="text-sm text-muted max-w-sm m-0">
          Thank you for reaching out, <strong>{name}</strong>. Our team will get back to you at <strong>{email}</strong> shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setName("");
            setEmail("");
            setPhone("");
            setSubject("");
            setMessage("");
          }}
          className="mt-2 text-sm text-brand font-medium hover:underline cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-4">
        <div className="flex-[1_1_220px]">
          <Field
            id="c-name"
            label="Full name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex-[1_1_220px]">
          <Field
            id="c-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-[1_1_220px]">
          <Field
            id="c-phone"
            label="Phone number (optional)"
            type="tel"
            placeholder="07XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="flex-[1_1_220px]">
          <Field
            id="c-subj"
            label="Subject"
            type="text"
            placeholder="Order question, product inquiry..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-msg" className="text-[13px] font-medium text-[#4A4943]">
          Message
        </label>
        <textarea
          id="c-msg"
          rows={5}
          placeholder="How can we help you today?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="box-border rounded-2xl border border-line bg-white p-[18px] text-base text-ink placeholder:text-[#9E9C94] focus:outline-none focus:border-brand transition-colors resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-14 rounded-full bg-brand text-white text-base font-medium flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer shadow-sm w-full mt-2"
      >
        {isSubmitting ? "Sending inquiry…" : "Send message"}
      </button>
    </form>
  );
}
