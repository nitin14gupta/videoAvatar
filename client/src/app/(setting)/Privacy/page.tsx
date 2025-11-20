import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy - LipSync AI",
    description: "Learn how LipSync AI protects your privacy and handles your data.",
};

export default function PrivacyPage() {
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
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
                    <p className="text-neutral-600">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Introduction</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            At LipSync AI, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered educational content creation platform.
                        </p>
                        <p className="text-neutral-700 leading-relaxed">
                            By using our service, you agree to the collection and use of information in accordance with this policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Information We Collect</h2>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Personal Information</h3>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6">
                            <li>Account information (name, email address, password)</li>
                            <li>Profile information you choose to provide</li>
                            <li>Communication data when you contact us</li>
                            <li>Payment information (processed securely through third-party providers)</li>
                        </ul>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Usage Information</h3>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2 mb-6">
                            <li>Content you create using our platform</li>
                            <li>Educational materials and projects you generate</li>
                            <li>Platform usage patterns and preferences</li>
                            <li>Device information and browser type</li>
                        </ul>

                        <h3 className="text-xl font-medium text-neutral-800 mb-3">Automatically Collected Information</h3>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>IP address and location data</li>
                            <li>Cookies and similar tracking technologies</li>
                            <li>Log files and analytics data</li>
                            <li>Performance and error information</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">How We Use Your Information</h2>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Provide and maintain our educational content creation services</li>
                            <li>Process your account registration and authentication</li>
                            <li>Generate personalized educational content using AI</li>
                            <li>Improve our platform and develop new features</li>
                            <li>Send you important updates and notifications</li>
                            <li>Provide customer support and respond to inquiries</li>
                            <li>Ensure platform security and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Information Sharing and Disclosure</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>With your explicit consent</li>
                            <li>To comply with legal requirements or court orders</li>
                            <li>To protect our rights, property, or safety, or that of our users</li>
                            <li>With trusted service providers who assist in platform operations (under strict confidentiality agreements)</li>
                            <li>In connection with a business transfer or acquisition</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Data Security</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Encryption of data in transit and at rest</li>
                            <li>Regular security assessments and updates</li>
                            <li>Access controls and authentication protocols</li>
                            <li>Secure data centers and infrastructure</li>
                            <li>Employee training on data protection practices</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Your Rights and Choices</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            You have the following rights regarding your personal information:
                        </p>
                        <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                            <li>Access and review your personal information</li>
                            <li>Correct or update inaccurate information</li>
                            <li>Delete your account and associated data</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Request data portability</li>
                            <li>Withdraw consent where applicable</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Cookies and Tracking</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser preferences.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Children's Privacy</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Changes to This Privacy Policy</h2>
                        <p className="text-neutral-700 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our service after any modifications constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
                        <p className="text-neutral-700 leading-relaxed mb-4">
                            If you have any questions about this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="bg-[#F5FBFC] p-6 rounded-lg">
                            <p className="text-neutral-700 mb-2"><strong>Email:</strong> privacy@lipsync.com</p>
                            <p className="text-neutral-700 mb-2"><strong>Address:</strong> LipSync AI, Privacy Department</p>
                            <p className="text-neutral-700">We will respond to your inquiry within 30 days.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
