"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useAnimation } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Cursor trail effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setCursorTrail((prev) => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
        return newTrail.slice(-10); // Keep last 10 positions
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#101621]">
      {/* Cursor Trail */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {cursorTrail.map((point, index) => (
          <div
            key={point.id}
            className="absolute w-2 h-2 rounded-full bg-[#0fffc3] opacity-30 blur-sm"
            style={{
              left: point.x - 4,
              top: point.y - 4,
              transition: "opacity 0.3s",
              opacity: (10 - index) / 10 * 0.3,
            }}
          />
        ))}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-[#0fffc3] pointer-events-none"
          style={{
            left: mousePosition.x - 8,
            top: mousePosition.y - 8,
            transition: "transform 0.1s",
            boxShadow: "0 0 20px rgba(15, 255, 195, 0.5)",
          }}
        />
      </div>

      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <HeroSection heroY={heroY} heroOpacity={heroOpacity} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Demo/Upload Section */}
      <DemoSection />

      {/* Avatar Gallery */}
      <AvatarGallery />

      {/* Testimonials */}
      <TestimonialsSection />

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
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? "bg-[#101621]/80 backdrop-blur-md" : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          className="text-2xl font-bold gradient-text"
          style={{ fontFamily: 'var(--font-orbitron)' }}
          whileHover={{ scale: 1.05 }}
        >
          VideoAvatar
        </motion.div>
        <div className="hidden md:flex gap-8 items-center">
          {["Features", "Demo", "Gallery", "Testimonials"].map((item) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-[#c3d3e2] hover:text-[#0fffc3] transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
              whileHover={{ scale: 1.1 }}
            >
              {item}
            </motion.a>
          ))}
          <Link href="/Login">
            <motion.button
              className="px-6 py-2 bg-gradient-to-r from-[#4e99ff] to-[#be65ff] rounded-full text-white font-semibold"
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

// Hero Section
function HeroSection({ heroY, heroOpacity }: { heroY: any; heroOpacity: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  return (
    <motion.section
      ref={containerRef}
      style={{ y: heroY, opacity: heroOpacity }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
          const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-[#abe6ff]"
              initial={{
                x: Math.random() * width,
                y: Math.random() * height,
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * height],
                x: [null, Math.random() * width],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          );
        })}
      </div>

      {/* Neural Wave Glow Effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#4e99ff]/20 to-[#be65ff]/20 blur-3xl" />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
              style={{ fontFamily: 'var(--font-orbitron)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              <span className="gradient-text block">Living</span>
              <span className="text-white block">Neural</span>
              <span className="gradient-text-mint block">Tech</span>
            </motion.h1>
            <motion.p
              className="text-xl text-[#c3d3e2] mb-8 leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
            >
              Experience the future of AI avatars. Create conversational, lifelike digital beings
              powered by neural networks and real-time interaction.
            </motion.p>
            <motion.div
              className="flex gap-4 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
            >
              <Link href="/Login">
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] rounded-full text-[#101621] font-bold text-lg"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    boxShadow: "0 0 20px rgba(15, 255, 195, 0.5), 0 0 40px rgba(15, 255, 195, 0.3)"
                  }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(15, 255, 195, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Your Avatar
                </motion.button>
              </Link>
              <motion.button
                className="px-8 py-4 border-2 border-[#4e99ff] rounded-full text-white font-semibold text-lg"
                style={{ fontFamily: 'var(--font-inter)' }}
                whileHover={{ scale: 1.05, borderColor: "#0fffc3", boxShadow: "0 0 30px rgba(78, 153, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                Watch Demo
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Avatar Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.div
              className="relative w-full max-w-md mx-auto"
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Neural Wave Lines - Outer Violet Border */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "3px solid #be65ff",
                  boxShadow: "0 0 30px rgba(190, 101, 255, 0.5)",
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.7, 0.4],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Neural Wave Lines - Middle Azure Border */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "2px solid #4e99ff",
                  margin: "8px",
                  boxShadow: "0 0 20px rgba(78, 153, 255, 0.4)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                  rotate: [360, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Avatar Image with Inner Mint Border */}
              <div className="relative z-10 rounded-full overflow-hidden" style={{
                border: "2px solid #0fffc3",
                boxShadow: "0 0 40px rgba(15, 255, 195, 0.6), inset 0 0 20px rgba(15, 255, 195, 0.2)",
                margin: "20px",
              }}>
                <Image
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&h=500&fit=crop"
                  alt="AI Avatar"
                  width={500}
                  height={500}
                  className="w-full h-auto object-cover rounded-full"
                />
              </div>

              {/* Floating Particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#abe6ff]"
                  style={{
                    top: `${20 + i * 10}%`,
                    left: `${10 + i * 12}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    x: [0, 20, 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

// Features Section
function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    {
      title: "Neural-Powered",
      description: "Advanced AI neural networks create lifelike conversations and expressions",
      icon: "🧠",
      gradient: "from-[#4e99ff] to-[#be65ff]",
    },
    {
      title: "Real-Time Interaction",
      description: "Instant responses with natural speech patterns and emotional intelligence",
      icon: "⚡",
      gradient: "from-[#0fffc3] to-[#4e99ff]",
    },
    {
      title: "Customizable Avatars",
      description: "Design unique avatars with personalized appearance and voice characteristics",
      icon: "🎨",
      gradient: "from-[#ff9aff] to-[#be65ff]",
    },
    {
      title: "Seamless Integration",
      description: "Easy API integration for websites, apps, and virtual environments",
      icon: "🔗",
      gradient: "from-[#ef476f] to-[#ff9aff]",
    },
  ];

  return (
    <section id="features" ref={ref} className="py-32 relative">
      {/* Section Divider */}
      <motion.div
        className="h-px w-full bg-gradient-to-r from-transparent via-[#4e99ff] to-transparent mb-20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1 }}
      />

      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold font-[var(--font-orbitron)] mb-4 gradient-text">
            Powerful Features
          </h2>
          <p className="text-xl text-[#c3d3e2] font-[var(--font-inter)] max-w-2xl mx-auto">
            Cutting-edge technology meets intuitive design
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-card rounded-2xl p-8 relative overflow-hidden group"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              {/* Gradient Background on Hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              />

              <div className="relative z-10">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold font-[var(--font-orbitron)] mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-[#c3d3e2] font-[var(--font-inter)] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Glow Effect */}
              <motion.div
                className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-20 blur-2xl`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Demo/Upload Section
function DemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section id="demo" ref={ref} className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold font-[var(--font-orbitron)] mb-4 gradient-text-mint">
            Try It Now
          </h2>
          <p className="text-xl text-[#c3d3e2] font-[var(--font-inter)] max-w-2xl mx-auto">
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
            className={`glass-card rounded-3xl p-12 border-2 border-dashed transition-all duration-300 ${isDragging
              ? "border-[#0fffc3] bg-[#0fffc3]/10 scale-105"
              : "border-[#4e99ff]/50 hover:border-[#4e99ff]"
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
            whileHover={{ scale: 1.02 }}
            animate={isDragging ? { scale: 1.05 } : {}}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-6"
                animate={isDragging ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                📤
              </motion.div>
              <h3 className="text-3xl font-bold font-[var(--font-orbitron)] mb-4 text-white">
                Drag & Drop Your Content
              </h3>
              <p className="text-[#c3d3e2] font-[var(--font-inter)] mb-8">
                Upload images, videos, or audio files to create your AI avatar
              </p>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-[#4e99ff] to-[#be65ff] rounded-full text-white font-[var(--font-inter)] font-semibold text-lg"
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

// Avatar Gallery
function AvatarGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const avatars = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  ];

  return (
    <section id="gallery" ref={ref} className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold font-[var(--font-orbitron)] mb-4 gradient-text">
            Avatars in Action
          </h2>
          <p className="text-xl text-[#c3d3e2] font-[var(--font-inter)] max-w-2xl mx-auto">
            See our AI avatars come to life
          </p>
        </motion.div>

        <div
          className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {avatars.map((avatar, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-80 h-80 rounded-2xl overflow-hidden glass-card group relative"
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              style={{
                rotateY: typeof window !== 'undefined' ? `${(mousePos.x / window.innerWidth - 0.5) * 10}deg` : '0deg',
                rotateX: typeof window !== 'undefined' ? `${(mousePos.y / window.innerHeight - 0.5) * -10}deg` : '0deg',
              }}
            >
              <Image
                src={avatar}
                alt={`Avatar ${index + 1}`}
                width={320}
                height={320}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101621]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-[var(--font-orbitron)] font-bold text-xl mb-2">
                    Avatar {index + 1}
                  </h3>
                  <p className="text-[#c3d3e2] font-[var(--font-inter)] text-sm">
                    Interactive AI Character
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechVenture",
      content: "VideoAvatar transformed our customer service. The AI avatars are incredibly lifelike and engaging.",
      logo: "🚀",
    },
    {
      name: "Marcus Johnson",
      role: "Creative Director, Digital Studio",
      content: "The neural-powered technology creates avatars that feel truly alive. Our users love it!",
      logo: "✨",
    },
    {
      name: "Emily Rodriguez",
      role: "Product Manager, InnovateLab",
      content: "Seamless integration and powerful features. This is the future of digital interaction.",
      logo: "💡",
    },
  ];

  return (
    <section id="testimonials" ref={ref} className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold font-[var(--font-orbitron)] mb-4 gradient-text-mint">
            Trusted by Innovators
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="glass-card rounded-2xl p-8 relative"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="text-4xl mb-4">{testimonial.logo}</div>
              <p className="text-[#c3d3e2] font-[var(--font-inter)] mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div>
                <h4 className="text-white font-[var(--font-orbitron)] font-bold text-lg mb-1">
                  {testimonial.name}
                </h4>
                <p className="text-[#4e99ff] font-[var(--font-inter)] text-sm">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Brand Logos */}
        <motion.div
          className="mt-20 flex flex-wrap justify-center items-center gap-12 opacity-60"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.6 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {["TechCorp", "InnovateLab", "DigitalStudio", "FutureTech", "NeuralAI"].map((brand, i) => (
            <motion.div
              key={brand}
              className="text-2xl font-[var(--font-orbitron)] text-[#c3d3e2]"
              whileHover={{ scale: 1.2, color: "#0fffc3" }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              {brand}
            </motion.div>
          ))}
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
    <section ref={ref} className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center glass-card rounded-3xl p-16 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#4e99ff]/20 via-[#be65ff]/20 to-[#0fffc3]/20"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10">
            <motion.h2
              className="text-5xl md:text-7xl font-bold font-[var(--font-orbitron)] mb-6 gradient-text-mint"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              Ready to Create Your Avatar?
            </motion.h2>
            <motion.p
              className="text-xl text-[#c3d3e2] font-[var(--font-inter)] mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
            >
              Join thousands of creators and businesses using AI avatars to revolutionize their digital presence.
            </motion.p>
            <Link href="/Login">
              <motion.button
                className="relative px-12 py-6 bg-gradient-to-r from-[#0fffc3] to-[#4e99ff] rounded-full text-[#101621] font-[var(--font-inter)] font-bold text-xl overflow-hidden group"
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

                {/* Ripple Effect */}
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/30"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
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
    <footer ref={ref} className="relative py-16 border-t border-[#4e99ff]/20">
      {/* Neural Pulse Line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0fffc3] to-transparent"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="h-full w-32 bg-[#0fffc3]"
          animate={{
            x: ["0%", "calc(100vw - 8rem)", "0%"],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#abe6ff]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-2xl font-bold font-[var(--font-orbitron)] gradient-text mb-4">
              VideoAvatar
            </h3>
            <p className="text-[#c3d3e2] font-[var(--font-inter)] text-sm">
              The future of AI-powered conversational avatars
            </p>
          </div>
          <div>
            <h4 className="text-white font-[var(--font-orbitron)] font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Demo", "API"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-[#c3d3e2] hover:text-[#0fffc3] transition-colors font-[var(--font-inter)] text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-[var(--font-orbitron)] font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-[#c3d3e2] hover:text-[#0fffc3] transition-colors font-[var(--font-inter)] text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-[var(--font-orbitron)] font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {["Privacy", "Terms", "Security"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-[#c3d3e2] hover:text-[#0fffc3] transition-colors font-[var(--font-inter)] text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#4e99ff]/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-[#c3d3e2] font-[var(--font-inter)] text-sm mb-4 md:mb-0">
            © 2024 VideoAvatar. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href={`#${social.toLowerCase()}`}
                className="text-[#c3d3e2] hover:text-[#0fffc3] transition-colors font-[var(--font-inter)] text-sm"
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