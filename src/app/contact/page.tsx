'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!mounted) {
    return <div className="min-h-screen bg-canvas" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success("Message sent successfully! We'll get back to you in 24 hours.");
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  const quickSupports = [
    {
      title: 'Sizing & Fit Advice',
      desc: 'Not sure which size to select for a growing toddler? We can guide you.',
      action: 'Ask Sizing Guide',
      subject: 'Size Guidance Inquiry',
    },
    {
      title: 'Easy Exchange & Returns',
      desc: 'Need a different size or pattern? Initiating a swap is fast and stress-free.',
      action: 'Start Exchange',
      subject: 'Exchange Request',
    },
    {
      title: 'Custom Celebrations',
      desc: 'Looking for matching brother-sister sets or custom birthday detailing?',
      action: 'Discuss Custom Design',
      subject: 'Custom Styling Inquiry',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* Header */}
      <section className="bg-surface py-20 border-b border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 text-center max-w-2xl">
          <p className="text-[0.72rem] font-bold tracking-[0.15em] uppercase text-clay mb-3">Get in Touch</p>
          <h1 className="font-head text-4xl md:text-5xl font-bold text-ink mb-4">Let's Celebrate Together</h1>
          <p className="text-text-mid text-[0.95rem] leading-[1.6]">
            Whether you have questions about our fabrics, sizing guides, custom orders, or just want to share feedback, we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="w-full mx-auto px-4 md:px-8 lg:px-12 py-16 lg:py-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Info */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <h2 className="font-head text-2xl font-bold text-ink mb-3">Our Boutique</h2>
              <p className="text-text-mid text-[0.92rem] leading-[1.6]">
                Each Mylini design is conceived and curated at our designer studio. Feel free to reach out online or via our phone helpline.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-rose-blush rounded-xl flex items-center justify-center shrink-0 border border-border-soft">
                  <Mail className="text-clay w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider mb-1">Email Support</h3>
                  <a href="mailto:love@mylini.com" className="text-[0.92rem] font-bold text-ink hover:text-clay transition-colors">love@mylini.com</a>
                  <p className="text-[0.78rem] text-text-light mt-0.5">We reply in 24 hours</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-rose-blush rounded-xl flex items-center justify-center shrink-0 border border-border-soft">
                  <Phone className="text-clay w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider mb-1">Helpline Number</h3>
                  <a href="tel:+919876543210" className="text-[0.92rem] font-bold text-ink hover:text-clay transition-colors">+91 98765 43210</a>
                  <p className="text-[0.78rem] text-text-light mt-0.5">Mon–Sat, 10 AM to 6 PM IST</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-rose-blush rounded-xl flex items-center justify-center shrink-0 border border-border-soft">
                  <MapPin className="text-clay w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider mb-1">Designer Studio</h3>
                  <p className="text-[0.92rem] font-bold text-ink">Mylini Ethnic Wear Studio</p>
                  <p className="text-[0.82rem] text-text-mid leading-relaxed">
                    12, Khader Nawaz Khan Road, Nungambakkam,<br />Chennai, Tamil Nadu - 600006
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-rose-blush rounded-xl flex items-center justify-center shrink-0 border border-border-soft">
                  <Clock className="text-clay w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider mb-1">Customer Support Hours</h3>
                  <p className="text-[0.92rem] font-semibold text-ink">10:00 AM – 06:00 PM (IST)</p>
                  <p className="text-[0.78rem] text-text-light mt-0.5">Closed on Sundays & National Holidays</p>
                </div>
              </div>
            </div>

            {/* Custom Gift Note Prompt */}
            <div className="bg-canvas-warm rounded-2xl p-5 border border-border-soft shadow-s1 flex items-start gap-4">
              <MessageSquare className="text-clay w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[0.88rem] font-bold text-ink mb-1">Sending a Gift?</h4>
                <p className="text-[0.78rem] text-text-mid leading-[1.5]">
                  We provide premium customized gift packaging and hand-written gift notes on certified handmade paper card for all festive deliveries at no extra cost. Mention it in your order notes or contact us after ordering!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 lg:p-10 border border-border-soft shadow-s3">
            <h2 className="font-head text-2xl font-bold text-ink mb-2">Send a Message</h2>
            <p className="text-[0.82rem] text-text-mid mb-8">Fill out the form below, and we will get back to you promptly.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Priyadharshini"
                    className="h-11 px-4 border-[1.5px] border-border rounded-xl font-body text-[0.85rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(196,101,74,0.1)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. priya@example.com"
                    className="h-11 px-4 border-[1.5px] border-border rounded-xl font-body text-[0.85rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(196,101,74,0.1)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    className="h-11 px-4 border-[1.5px] border-border rounded-xl font-body text-[0.85rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(196,101,74,0.1)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="subject" className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="h-11 px-4 border-[1.5px] border-border rounded-xl font-body text-[0.85rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(196,101,74,0.1)]"
                  >
                    <option value="">Select a subject...</option>
                    <option value="Sizing Advice">Sizing & Fit Advice</option>
                    <option value="Order Status">Order Tracking & Status</option>
                    <option value="Exchange/Return">Returns & Exchanges</option>
                    <option value="Custom Order">Custom Wedding/Party Orders</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-[0.72rem] font-bold text-text-light uppercase tracking-wider">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help make your child's special occasion memorable?"
                  className="p-4 border-[1.5px] border-border rounded-xl font-body text-[0.85rem] bg-white text-text outline-none transition-all duration-[--t] focus:border-clay focus:shadow-[0_0_0_3px_rgba(196,101,74,0.1)] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 bg-clay-deep text-white text-[0.88rem] font-bold rounded-xl flex items-center justify-center gap-2 shadow-s2 transition-all hover:bg-clay disabled:bg-clay/50 disabled:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-sage/10 border border-sage/35 text-sage rounded-2xl text-[0.82rem] font-semibold text-center mt-2"
                  >
                    ✓ Thank you! Your message has been received. We will review it and reply within 24 hours.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </section>

      {/* Quick Help Strips */}
      <section className="bg-canvas-warm py-20 border-t border-border-soft">
        <div className="w-full mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="font-head text-3xl font-bold text-ink mb-3">Quick Assistance</h2>
            <p className="text-text-mid text-[0.9rem]">Frequently asked support topics that might help you instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickSupports.map((supp, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-border-soft shadow-s1 flex flex-col justify-between items-start gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="w-9 h-9 bg-rose-blush rounded-lg flex items-center justify-center shrink-0 border border-border-soft">
                    <HelpCircle className="text-clay w-4 h-4" />
                  </div>
                  <h3 className="font-head text-[1.05rem] font-bold text-ink">{supp.title}</h3>
                  <p className="text-[0.78rem] text-text-mid leading-[1.5]">{supp.desc}</p>
                </div>
                <button
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      subject: supp.subject,
                    }));
                    document.getElementById('name')?.scrollIntoView({ behavior: 'smooth' });
                    toast.info(`Subject auto-selected: ${supp.subject}`);
                  }}
                  className="text-clay font-bold text-[0.8rem] hover:underline underline-offset-4"
                >
                  {supp.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
