import { Link } from 'react-router-dom';
import { ArrowRight, Users, Image, Calendar, Lock, Zap, Heart, Sparkles, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Interactive Family Tree',
      description: 'Build and visualize your family connections with our intuitive tree builder.',
    },
    {
      icon: Image,
      title: 'Preserve Memories',
      description: 'Upload photos, videos, and stories to keep your family history alive.',
    },
    {
      icon: Calendar,
      title: 'Never Miss Birthdays',
      description: 'Automatic reminders for birthdays, anniversaries, and special events.',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your family data is encrypted and only accessible by invited members.',
    },
    {
      icon: Zap,
      title: 'Easy Collaboration',
      description: 'Invite family members to contribute and keep the tree up to date.',
    },
    {
      icon: Heart,
      title: 'Heritage Preservation',
      description: 'Document traditions, recipes, and stories for future generations.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen">
      {/* Animated Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              className="text-2xl font-bold gradient-text flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              🌳 Family Tree
            </motion.div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </motion.div>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <motion.div 
          className="max-w-7xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
              <Star size={16} className="fill-current" />
              Preserve Your Legacy
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-7xl font-bold mb-6">
            <span className="gradient-text">Your Family Story</span>
            <br />
            For Generations to Come
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Build, preserve, and share your family tree. Connect generations, celebrate memories, 
            and keep your heritage alive forever.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="btn btn-primary flex items-center text-lg px-8 py-4">
                Start Free <ArrowRight size={20} className="ml-2" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/pricing" className="btn bg-white border-2 border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-700 flex items-center text-lg px-8 py-4">
                View Pricing
              </Link>
            </motion.div>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="mt-8 text-sm text-gray-500 flex items-center justify-center gap-2"
          >
            <span className="flex items-center gap-1">
              <Lock size={16} /> 100% Secure
            </span>
            <span className="mx-2">•</span>
            <span className="flex items-center gap-1">
              <Heart size={16} className="text-red-500 fill-current" /> Free Forever Plan
            </span>
            <span className="mx-2">•</span>
            <span className="flex items-center gap-1">
              <TrendingUp size={16} /> Upgrade Anytime
            </span>
          </motion.p>
        </motion.div>

        {/* Floating decorative elements */}
        {['🌳', '💚', '🎄', '🌸', '🦋'].map((emoji, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ 
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
            className="absolute text-4xl opacity-20"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 2) * 40}%`
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-4"
            >
              <Sparkles className="text-primary-600 mx-auto" size={40} />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4 gradient-text">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to preserve and celebrate your family legacy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.03 }}
                  className="card group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 relative z-10"
                  >
                    <Icon className="text-primary-600" size={24} />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 relative z-10">{feature.title}</h3>
                  <p className="text-gray-600 relative z-10">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <motion.div 
          className="max-w-4xl mx-auto text-center px-4 relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <Heart className="text-white mx-auto fill-current" size={50} />
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Building Your Family Legacy Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of families preserving their stories for generations to come
          </p>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to="/register" 
              className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 inline-flex items-center"
            >
              Get Started Free <ArrowRight size={20} className="ml-2" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"></div>
        </div>
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.p
            whileHover={{ scale: 1.05 }}
            className="text-lg"
          >
            © 2026 <span className="text-primary-400 font-semibold">Family Tree</span>. All rights reserved.
          </motion.p>
          <p className="mt-2 text-sm">Made with ❤️ for families worldwide</p>
        </motion.div>
      </footer>
    </div>
  );
}
