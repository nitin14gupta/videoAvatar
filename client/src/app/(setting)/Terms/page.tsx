import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service - EduCreate AI",
    description: "Terms and conditions for using EduCreate AI educational content creation platform.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-[#F5FBFC]">
            <div className="mx-auto max-w-4xl px-6 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[#4CB1B9] hover:text-[#2EA3AB] transition-colors mb-6"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">Terms of Service</h1>
                    <p className="text-neutral-600">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Agreement to Terms</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            These Terms of Service ("Terms") govern your use of EduCreate AI ("we," "our," or "us") and our AI-powered educational content creation platform (the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                        </p>
                        <p className="text-neutral-700 leading-relaxed">
                            If you disagree with any part of these terms, then you may not access the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Description of Service</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            EduCreate AI is an artificial intelligence-powered platform that enables users to create educational content including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Interactive lessons and courses</li>
                            <li>Quizzes and assessments</li>
                            <li>Visual content and presentations</li>
                            <li>Storyboards and scripts</li>
                            <li>Voice narration and avatars</li>
                            <li>Concept mapping and knowledge organization</li>
                            <li>Multilingual content and localization</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">User Accounts</h2>
                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Account Creation</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            To access certain features of our Service, you must create an account. You agree to:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6">
                            <li>Provide accurate, current, and complete information</li>
                            <li>Maintain and update your account information</li>
                            <li>Keep your password secure and confidential</li>
                            <li>Accept responsibility for all activities under your account</li>
                            <li>Notify us immediately of any unauthorized use</li>
                        </ul>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Account Requirements</h3>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>You must be at least 13 years old to create an account</li>
                            <li>You must provide a valid email address</li>
                            <li>One person or entity may maintain only one account</li>
                            <li>You may not create accounts for others without permission</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Acceptable Use</h2>
                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Permitted Uses</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            You may use our Service to create educational content for legitimate educational purposes, including:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6">
                            <li>Personal learning and skill development</li>
                            <li>Educational instruction and training</li>
                            <li>Academic research and study</li>
                            <li>Professional development and certification</li>
                            <li>Non-commercial educational projects</li>
                        </ul>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Prohibited Uses</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            You agree not to use our Service for any unlawful or prohibited purpose, including:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Creating content that violates any applicable laws or regulations</li>
                            <li>Generating harmful, offensive, or inappropriate material</li>
                            <li>Infringing on intellectual property rights of others</li>
                            <li>Attempting to gain unauthorized access to our systems</li>
                            <li>Distributing malware, viruses, or other harmful code</li>
                            <li>Spamming or sending unsolicited communications</li>
                            <li>Impersonating others or providing false information</li>
                            <li>Commercial use without proper authorization</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Intellectual Property Rights</h2>
                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Our Rights</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            The Service and its original content, features, and functionality are owned by EduCreate AI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                        </p>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Your Content</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            You retain ownership of the content you create using our Service ("User Content"). By using our Service, you grant us a limited, non-exclusive, royalty-free license to:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Process and store your content to provide the Service</li>
                            <li>Improve our AI models and algorithms</li>
                            <li>Generate derivative works for your educational purposes</li>
                            <li>Display your content within the platform</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">AI-Generated Content</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Our Service uses artificial intelligence to generate educational content. Please note:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>AI-generated content is provided for educational purposes only</li>
                            <li>You are responsible for reviewing and validating all generated content</li>
                            <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
                            <li>You should verify facts and information before using content in educational settings</li>
                            <li>AI-generated content may not be suitable for all educational contexts</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Privacy and Data Protection</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                        </p>
                        <p className="text-neutral-700 leading-relaxed">
                            By using our Service, you consent to the collection and use of information in accordance with our Privacy Policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Payment Terms</h2>
                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Subscription Fees</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Some features of our Service may require a paid subscription. Subscription fees are billed in advance and are non-refundable except as required by law.
                        </p>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Payment Processing</h3>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            Payment processing is handled by third-party providers. We do not store your payment information on our servers.
                        </p>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Cancellation</h3>
                        <p className="text-neutral-700 leading-relaxed">
                            You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing period.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Service Availability</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            We strive to provide continuous service availability, but we do not guarantee that our Service will be uninterrupted or error-free. We may:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Perform scheduled maintenance and updates</li>
                            <li>Experience temporary outages due to technical issues</li>
                            <li>Modify or discontinue features with reasonable notice</li>
                            <li>Suspend service for violations of these Terms</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Limitation of Liability</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            To the maximum extent permitted by law, EduCreate AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Loss of profits, data, or business opportunities</li>
                            <li>Service interruptions or downtime</li>
                            <li>Errors or inaccuracies in AI-generated content</li>
                            <li>Third-party actions or content</li>
                            <li>Any damages arising from your use of the Service</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Termination</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            We may terminate or suspend your account and access to our Service immediately, without prior notice, for any reason, including if you breach these Terms.
                        </p>
                        <p className="text-neutral-700 leading-relaxed">
                            Upon termination, your right to use the Service will cease immediately. We may delete your account and associated data at our discretion.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Changes to Terms</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Governing Law</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which EduCreate AI operates, without regard to conflict of law principles.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Information</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            If you have any questions about these Terms of Service, please contact us:
                        </p>
                        <div className="bg-[#F5FBFC] p-6 rounded-lg">
                            <p className="text-neutral-700 mb-2"><strong>Email:</strong> legal@educreate-ai.com</p>
                            <p className="text-neutral-700 mb-2"><strong>Address:</strong> EduCreate AI, Legal Department</p>
                            <p className="text-neutral-700">We will respond to your inquiry within 30 days.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
