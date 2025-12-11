"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useAnimation } from "framer-motion";
import CustomCursor from "@/src/component/CustomCursor";
import { HeroGeometric } from "@/src/components/ui/shape-landing-hero";
import TestimonialCard, { Testimonial } from "@/src/components/ui/multi-media-testimonials";
import { FeatureSteps } from "@/src/components/ui/features-section";
import CurvedLoop from "@/src/component/CurvedLoop";
import InfiniteMenu from "@/src/component/InfiniteMenu";
import Link from "next/link";
export default function Home() {

  const testimonials: Testimonial[] = [
    {
      name: "Alice Johnson",
      profile: "https://github.com/shadcn.png",
      title: "Improved Interview Workflow",
      designation: "Software Engineer",
      content:
        "Ruvy transformed the way I manage my interviews. Highly recommended for professionals looking to save time!",
    },
    {
      name: "Bob Smith",
      profile: "https://github.com/shadcn.png",
      title: "Simplicity at Its Best",
      designation: "Product Manager",
      content:
        "The simplicity of this platform is unmatched. Perfect for small teams and startups.",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/components-preview/popular/three-dwall-calendar-dark.jpg",
    },
    {
      name: "Charlie Lee",
      profile: "https://github.com/shadcn.png",
      title: "Creative and Efficient Platform",
      designation: "UX Designer",
      content: "",
      mediaUrl: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/crm(1)(1)(1).mp4",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "Diana Prince",
      profile: "https://github.com/shadcn.png",
      title: "Flawless Scheduling Experience",
      designation: "Full Stack Developer",
      content:
        "The UI is sleek, intuitive, and makes scheduling interviews a breeze. 10/10 experience!",
    },
    {
      name: "Ethan Hunt",
      profile: "https://github.com/shadcn.png",
      title: "Streamlined Pipeline Management",
      designation: "DevOps Engineer",
      content:
        "Managing my pipelines has never been easier thanks to this platform. Excellent UX!",
    },
    {
      name: "Fiona Gallagher",
      profile: "https://github.com/shadcn.png",
      title: "Smooth and Intuitive Interface",
      designation: "Frontend Developer",
      content: "",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "George Martin",
      profile: "https://github.com/shadcn.png",
      title: "Visually Stunning Design",
      designation: "Backend Developer",
      content: "",
      mediaUrl: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/crm(1)(1)(1).mp4",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "Hannah Lee",
      profile: "https://github.com/shadcn.png",
      title: "Efficient Testing Workflow",
      designation: "QA Engineer",
      content:
        "Testing has become more efficient with the tools provided here. Very intuitive and well-designed.",
    },
    {
      name: "Ian Wright",
      profile: "https://github.com/shadcn.png",
      title: "Time-Saving Integration",
      designation: "Data Scientist",
      content:
        "I can now schedule interviews without leaving my workspace. Saves so much time!",
    },
    {
      name: "Jane Doe",
      profile: "https://github.com/shadcn.png",
      title: "Clean Visual Presentation",
      designation: "AI Researcher",
      content: "",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/components-preview/popular/ripple-distortion-dark.png",
    },
    {
      name: "Kyle Brown",
      profile: "https://github.com/shadcn.png",
      title: "Smooth Playback Experience",
      designation: "UI Designer",
      content: "",
      mediaUrl: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/crm(1)(1)(1).mp4",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "Laura Kim",
      profile: "https://github.com/shadcn.png",
      title: "Simple Yet Powerful",
      designation: "Full Stack Developer",
      content:
        "The simplicity of this platform is unmatched. Perfect for small teams and startups.",
    },
    {
      name: "Michael Scott",
      profile: "https://github.com/shadcn.png",
      title: "Organized Interview Management",
      designation: "Project Manager",
      content:
        "I can track and organize interviews effortlessly. Love the clean UI and responsiveness.",
    },
    {
      name: "Nina Patel",
      profile: "https://github.com/shadcn.png",
      title: "Elegant Visual Experience",
      designation: "Mobile Developer",
      content: "",
      mediaUrl: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/crm(1)(1)(1).mp4",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "Oscar Wilde",
      profile: "https://github.com/shadcn.png",
      title: "Impressive User Flow",
      designation: "Content Strategist",
      content: "",
      mediaUrl: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/crm(1)(1)(1).mp4",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "Pam Beesly",
      profile: "https://github.com/shadcn.png",
      title: "Showcasing Client Feedback",
      designation: "Graphic Designer",
      content:
        "Love the clean testimonial cards and how easy it is to showcase our client feedback.",
    },
    {
      name: "Quentin Tarantino",
      profile: "https://github.com/shadcn.png",
      title: "Perfect for Creative Professionals",
      designation: "Video Editor",
      content: "",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/components-preview/popular/tag-cloud-select-dark.jpg",
    },
    {
      name: "Rachel Green",
      profile: "https://github.com/shadcn.png",
      title: "Enhanced Collaboration",
      designation: "Marketing Specialist",
      content: "",
      mediaUrl: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/crm(1)(1)(1).mp4",
      thumbnail: "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/dashboard-gradient.png",
    },
    {
      name: "Steve Rogers",
      profile: "https://github.com/shadcn.png",
      title: "Streamlined Recruitment Process",
      designation: "Team Lead",
      content:
        "This platform streamlines our recruitment process like never before. Highly efficient!",
    },
    {
      name: "Tina Fey",
      profile: "https://github.com/shadcn.png",
      title: "Beautifully Designed Platform",
      designation: "Copywriter",
      content:
        "Beautifully designed, intuitive, and extremely user-friendly. Can't recommend enough!",
    },
  ];

  const features = [
    {
      step: 'Step 1',
      title: 'Learn the Basics',
      content: 'Start your Web3 journey by learning the basics of blockchain.',
      image: 'https://images.unsplash.com/photo-1723958929247-ef054b525153?q=80&w=2070&auto=format&fit=crop'
    },
    {
      step: 'Step 2',
      title: 'Deep Dive',
      content: 'Dive deep into blockchain fundamentals and smart contract development.',
      image: 'https://images.unsplash.com/photo-1723931464622-b7df7c71e380?q=80&w=2070&auto=format&fit=crop'
    },
    {
      step: 'Step 3',
      title: 'Build Projects',
      content: 'Graduate with hands-on Web3 experience through building decentralized applications.',
      image: 'https://images.unsplash.com/photo-1725961476494-efa87ae3106a?q=80&w=2070&auto=format&fit=crop'
    },
  ]

  const menuItems = [
    {
      image: 'https://picsum.photos/300/300?grayscale',
      link: 'https://google.com/',
      title: 'Item 1',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://picsum.photos/400/400?grayscale',
      link: 'https://google.com/',
      title: 'Item 2',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://picsum.photos/500/500?grayscale',
      link: 'https://google.com/',
      title: 'Item 3',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://picsum.photos/600/600?grayscale',
      link: 'https://google.com/',
      title: 'Item 4',
      description: 'This is pretty cool, right?'
    }
  ];


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030303]">
      <CustomCursor />

      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <HeroGeometric
        badge="AI Avatar Platform"
        title1="Living Neural"
        title2="Tech Experience"
      />
      <InfiniteMenu items={menuItems} />

      {/* Features Section */}
      {/* <FeaturesSection /> */}
      <FeatureSteps
        features={features}
        title="Your Journey Starts Here"
        autoPlayInterval={4000}
        imageHeight="h-[500px]"
      />

      {/* Demo/Upload Section */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
        <DemoSection />
        <CurvedLoop
          marqueeText="Be ✦ Creative ✦ With ✦ Video ✦ Avatar ✦"
          speed={3}
          curveAmount={500}
          direction="right"
          interactive={true}
          className="custom-text-style"
        />
      </div>

      {/* Testimonials */}
      {/* <TestimonialsSection /> */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-4xl font-bold mb-12 text-foreground">
            Our clients love working with us because we go beyond great design to
            deliver real results.
          </h2>

          {Array.isArray(testimonials) && testimonials.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
              {testimonials.map((t, i) => (
                <TestimonialCard key={i} testimonial={t} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No testimonials yet.
            </p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Navigation Component
function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? "bg-[#030303]/80 backdrop-blur-md" : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          className="text-2xl font-bold"
          style={{
            fontFamily: 'var(--font-orbitron)',
            background: 'linear-gradient(135deg, #4e99ff, #be65ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          whileHover={{ scale: 1.05 }}
        >
          VideoAvatar
        </motion.div>
        <div className="hidden md:flex gap-8 items-center">
          {["Features", "Demo", "Gallery", "Testimonials"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-white/60 hover:text-[#0fffc3] transition-colors text-sm tracking-wide"
              style={{ fontFamily: 'var(--font-inter)' }}
              whileHover={{ scale: 1.1 }}
            >
              {item}
            </motion.a>
          ))}
          <Link href="/Login">
            <motion.button
              className="px-6 py-2.5 bg-gradient-to-r from-[#4e99ff] to-[#be65ff] rounded-full text-white text-sm font-medium tracking-wide"
              style={{ fontFamily: 'var(--font-inter)' }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(78, 153, 255, 0.6)" }}
              whileTap={{ scale: 0.95 }}
            >
              Try Your Avatar
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// Demo/Upload Section
function DemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section id="demo" ref={ref} className="py-32 relative bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0fffc3]/[0.02] via-transparent to-[#4e99ff]/[0.02] blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0fffc3] to-[#4e99ff]">
              Try It Now
            </span>
          </h2>
          <p className="text-lg text-white/40 font-light tracking-wide max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
            Upload your content and watch the magic happen
          </p>
        </motion.div>

        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className={`rounded-3xl p-12 border border-dashed transition-all duration-300 bg-white/[0.02] backdrop-blur-sm ${isDragging
              ? "border-[#0fffc3] bg-[#0fffc3]/5 scale-105"
              : "border-white/[0.15] hover:border-[#4e99ff]/50"
              }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            whileHover={{ scale: 1.01 }}
            animate={isDragging ? { scale: 1.03 } : {}}
          >
            <div className="text-center">
              <motion.div
                className="text-5xl mb-6"
                animate={isDragging ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                📤
              </motion.div>
              <h3 className="text-2xl font-bold mb-4 text-white tracking-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
                Drag & Drop Your Content
              </h3>
              <p className="text-white/40 text-sm mb-8 font-light tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
                Upload images, videos, or audio files to create your AI avatar
              </p>
              <motion.button
                className="px-8 py-3.5 bg-gradient-to-r from-[#4e99ff] to-[#be65ff] rounded-full text-white text-sm font-medium tracking-wide"
                style={{ fontFamily: 'var(--font-inter)' }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(78, 153, 255, 0.6)" }}
                whileTap={{ scale: 0.95 }}
              >
                Choose Files
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section ref={ref} className="py-32 relative bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4e99ff]/[0.03] via-transparent to-[#be65ff]/[0.03] blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center rounded-3xl p-16 relative overflow-hidden border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="relative z-10">
            <motion.h2
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
              style={{ fontFamily: 'var(--font-orbitron)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0fffc3] to-[#4e99ff]">
                Ready to Create Your Avatar?
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-white/40 font-light mb-10 max-w-2xl mx-auto tracking-wide"
              style={{ fontFamily: 'var(--font-inter)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
            >
              Join thousands of creators and businesses using AI avatars to revolutionize their digital presence.
            </motion.p>
            <Link href="/Login">
              <motion.button
                className="relative px-10 py-4 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] rounded-full text-[#030303] text-base font-medium tracking-wide overflow-hidden group"
                style={{ fontFamily: 'var(--font-inter)' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
              >
                <span className="relative z-10">Try Your Avatar Now</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#4e99ff] to-[#be65ff]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isHovered ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <footer ref={ref} className="relative py-16 bg-[#030303] border-t border-white/[0.08]">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4e99ff] to-[#be65ff]">
                VideoAvatar
              </span>
            </h3>
            <p className="text-white/40 text-sm font-light tracking-wide" style={{ fontFamily: 'var(--font-inter)' }}>
              The future of AI-powered conversational avatars
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide" style={{ fontFamily: 'var(--font-orbitron)' }}>Product</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Demo", "API"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-white/40 hover:text-[#0fffc3] transition-colors text-xs font-light tracking-wide"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide" style={{ fontFamily: 'var(--font-orbitron)' }}>Company</h4>
            <ul className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-white/40 hover:text-[#0fffc3] transition-colors text-xs font-light tracking-wide"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide" style={{ fontFamily: 'var(--font-orbitron)' }}>Legal</h4>
            <ul className="space-y-2">
              {["Privacy", "Terms", "Security"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-white/40 hover:text-[#0fffc3] transition-colors text-xs font-light tracking-wide"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/30 text-xs font-light tracking-wide mb-4 md:mb-0" style={{ fontFamily: 'var(--font-inter)' }}>
            © 2024 VideoAvatar. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href={`#${social.toLowerCase()}`}
                className="text-white/30 hover:text-[#0fffc3] transition-colors text-xs font-light tracking-wide"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}