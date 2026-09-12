import React, { useState } from 'react';
import { X, Mail, ShieldCheck, FileText, Info, Send, CheckCircle2 } from 'lucide-react';
import { BlogConfig } from '../types';

interface FooterPagesModalProps {
  activeTab: 'about' | 'contact' | 'privacy' | 'terms' | null;
  onClose: () => void;
  config: BlogConfig;
}

export const FooterPagesModal: React.FC<FooterPagesModalProps> = ({
  activeTab,
  onClose,
  config,
}) => {
  const [currentTab, setCurrentTab] = useState<'about' | 'contact' | 'privacy' | 'terms'>(
    activeTab || 'about'
  );

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!activeTab) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-500">
            {currentTab === 'about' && <Info className="w-4 h-4" />}
            {currentTab === 'contact' && <Mail className="w-4 h-4" />}
            {currentTab === 'privacy' && <ShieldCheck className="w-4 h-4" />}
            {currentTab === 'terms' && <FileText className="w-4 h-4" />}
            <span>
              {currentTab === 'about' && 'About Thunder Appz'}
              {currentTab === 'contact' && 'Contact Publisher'}
              {currentTab === 'privacy' && 'Privacy Policy'}
              {currentTab === 'terms' && 'Terms & Conditions'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center space-x-2 sm:space-x-4 text-xs font-mono bg-white dark:bg-neutral-900 overflow-x-auto">
          <button
            onClick={() => setCurrentTab('about')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'about'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-neutral-500 hover:text-rose-500'
            }`}
          >
            About Us
          </button>
          <button
            onClick={() => setCurrentTab('contact')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'contact'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-neutral-500 hover:text-rose-500'
            }`}
          >
            Contact Us
          </button>
          <button
            onClick={() => setCurrentTab('privacy')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'privacy'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-neutral-500 hover:text-rose-500'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setCurrentTab('terms')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              currentTab === 'terms'
                ? 'bg-rose-600 text-white font-bold'
                : 'text-neutral-500 hover:text-rose-500'
            }`}
          >
            Terms & Conditions
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans">
          
          {/* 1. ABOUT US TAB */}
          {currentTab === 'about' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-white">
                About Thunder Appz
              </h2>
              <p className="text-sm">
                <strong>Thunder Appz</strong> is a premier digital technology publication and knowledge portal providing comprehensive tutorials, system administration benchmarks, cloud architecture analysis, and software engineering insights.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-bold text-rose-500 mb-1 font-mono text-xs uppercase">Systems & Infrastructure</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Detailed step-by-step guides covering Linux server optimization, Nginx configuration, containerization, and VPS management.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-bold text-rose-500 mb-1 font-mono text-xs uppercase">Security & Cloud Networking</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Proactive security hardening, firewall configurations, SSL management, and high-availability cloud setups.
                  </p>
                </div>
              </div>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-serif pt-2">
                Our Editorial Mission
              </h3>
              <p>
                Our team strives to empower developers, system administrators, and technology enthusiasts with clear, verified, and practical technical content. Every article is rigorously researched and tested before publication.
              </p>

              <div className="pt-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono border-t border-neutral-200 dark:border-neutral-800">
                Official Website: thunder-appz.eu.org • Published by @{config.username}
              </div>
            </div>
          )}

          {/* 2. CONTACT US TAB */}
          {currentTab === 'contact' && (
            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-white">
                Contact Editorial Team
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Have questions, editorial suggestions, or business inquiries? Please reach out using the form below or email us directly at <a href="mailto:freefiregtamcpe@gmail.com" className="text-rose-500 underline font-mono">freefiregtamcpe@gmail.com</a>.
              </p>

              {isSubmitted ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h3 className="font-bold text-emerald-400">Message Received</h3>
                  <p className="text-xs text-neutral-400">
                    Thank you for contacting us. Our team will review your inquiry and respond promptly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-500 mb-1">Your Name *</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:ring-1 focus:ring-rose-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold text-neutral-500 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:ring-1 focus:ring-rose-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-neutral-500 mb-1">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="General Inquiry / Editorial Feedback"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-neutral-500 mb-1">Message *</label>
                    <textarea
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your message here..."
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white focus:ring-1 focus:ring-rose-500 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. PRIVACY POLICY TAB */}
          {currentTab === 'privacy' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-white">
                Privacy Policy
              </h2>
              <p className="text-neutral-500 font-mono">Effective Date: August 2026</p>

              <p>
                At <strong>Thunder Appz</strong>, accessible from https://thunder-appz.eu.org, one of our main priorities is the privacy of our visitors. This Privacy Policy document outlines the types of information collected and recorded by Thunder Appz and how we use it.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                1. Information We Collect
              </h3>
              <p>
                If you contact us directly via email or our contact form, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you choose to provide.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                2. Log Files & Site Analytics
              </h3>
              <p>
                Thunder Appz follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                3. Cookies and Web Beacons
              </h3>
              <p>
                Like any other website, Thunder Appz uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                4. Third-Party Advertising Partners
              </h3>
              <p>
                Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons in their respective advertisements and links that appear on Thunder Appz. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.
              </p>
              <p>
                Note that Thunder Appz has no access to or control over these cookies that are used by third-party advertisers. You can choose to disable cookies through your individual browser options.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                5. Data Protection Rights (GDPR & CCPA)
              </h3>
              <p>
                We would like to make sure you are fully aware of all of your data protection rights:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
                <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
                <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data under certain conditions.</li>
                <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data.</li>
              </ul>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                6. Children's Information
              </h3>
              <p>
                Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. Thunder Appz does not knowingly collect any Personal Identifiable Information from children under the age of 13.
              </p>
            </div>
          )}

          {/* 4. TERMS & CONDITIONS TAB */}
          {currentTab === 'terms' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-white">
                Terms and Conditions
              </h2>
              <p className="text-neutral-500 font-mono">Effective Date: August 2026</p>

              <p>
                Welcome to <strong>Thunder Appz</strong>! These terms and conditions outline the rules and regulations for the use of Thunder Appz's Website, located at https://thunder-appz.eu.org. By accessing this website, we assume you accept these terms and conditions in full.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                1. Intellectual Property Rights
              </h3>
              <p>
                Unless otherwise stated, Thunder Appz and/or its licensors own the intellectual property rights for all material on Thunder Appz. All intellectual property rights are reserved. You may view and print pages from the website for your own personal use subject to restrictions set in these terms and conditions.
              </p>
              <p>You must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Republish material from Thunder Appz without prior written consent</li>
                <li>Sell, rent or sub-license material from Thunder Appz</li>
                <li>Reproduce, duplicate or copy material from Thunder Appz</li>
              </ul>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                2. Educational & Technical Content Disclaimer
              </h3>
              <p>
                All articles, scripts, tutorials, and command-line instructions on Thunder Appz are provided for informational and educational purposes only. While we aim for complete accuracy, users implement technical commands at their own risk.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                3. Limitation of Liability
              </h3>
              <p>
                In no event shall Thunder Appz, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website whether such liability is under contract, tort, or otherwise.
              </p>

              <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-mono uppercase text-rose-500 pt-2">
                4. Changes to Terms
              </h3>
              <p>
                Thunder Appz reserves the right to revise these terms at any time as it sees fit. By using this website you are expected to review these terms on a regular basis.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-xs font-mono text-neutral-500">
          <span>© {new Date().getFullYear()} Thunder Appz</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
