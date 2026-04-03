import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, form);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="contact-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#B55B49] font-medium text-sm tracking-widest uppercase mb-4">Get in Touch</p>
          <h1 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-light text-[#2C1A12] tracking-tight leading-tight mb-3" data-testid="contact-title">
            Contact Us
          </h1>
          <p className="text-[#6B5744] text-base mb-12 max-w-lg">
            Have a coffee shop recommendation? Want to collaborate? Or just want to say hello? We'd love to hear from you.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E8E3D9] rounded-lg p-10 text-center"
            data-testid="contact-success"
          >
            <CheckCircle className="w-12 h-12 text-[#B55B49] mx-auto mb-4" />
            <h2 className="font-['Cormorant_Garamond'] text-2xl text-[#2C1A12] mb-2">Message Sent</h2>
            <p className="text-[#6B5744] mb-6">Thank you for reaching out. We'll get back to you soon.</p>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9]"
              data-testid="send-another-btn"
            >
              Send Another Message
            </Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={handleSubmit}
            className="bg-white border border-[#E8E3D9] rounded-lg p-8 space-y-6"
            data-testid="contact-form"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm" data-testid="contact-error">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-[#2C1A12] text-sm font-medium">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="mt-1.5 bg-[#FDFBF7] border-[#E8E3D9] focus:border-[#B55B49]"
                  data-testid="contact-name-input"
                />
              </div>
              <div>
                <Label className="text-[#2C1A12] text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="mt-1.5 bg-[#FDFBF7] border-[#E8E3D9] focus:border-[#B55B49]"
                  data-testid="contact-email-input"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#2C1A12] text-sm font-medium">Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us about a great coffee shop, or anything else on your mind..."
                required
                rows={5}
                className="mt-1.5 bg-[#FDFBF7] border-[#E8E3D9] focus:border-[#B55B49]"
                data-testid="contact-message-input"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2 font-medium"
              data-testid="contact-submit-btn"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
