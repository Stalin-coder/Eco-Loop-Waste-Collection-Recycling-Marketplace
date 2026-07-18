import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Leaf, Recycle, Truck, Building2, ArrowRight, Calendar, Bell, PackageCheck,
  DollarSign, MapPin, Route, ShoppingCart, BarChart3, TreePine, Droplets,
  Users, Factory, Globe, Star, ChevronRight, Mail, Phone, MapPinned,
  Twitter, Facebook, Instagram, Linkedin, Menu, X, TrendingUp, Shield,
  Award, Heart, Sparkles, Zap
} from 'lucide-react';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const }
  })
};

const stats = [
  { label: 'Waste Recycled', value: '12,500+ kg', icon: Recycle },
  { label: 'Collectors Active', value: '350+', icon: Truck },
  { label: 'Households Participating', value: '2,800+', icon: Users },
  { label: 'CO₂ Emissions Reduced', value: '8,200 kg', icon: TreePine },
];

const steps = [
  {
    step: '01',
    title: 'Schedule Pickup',
    desc: 'Households schedule recyclable waste pickup through the platform — in just a few taps.',
    icon: Calendar,
  },
  {
    step: '02',
    title: 'Collector Pickup',
    desc: 'Nearby collectors receive pickup alerts and collect the waste from your doorstep.',
    icon: Truck,
  },
  {
    step: '03',
    title: 'Waste Gets Recycled',
    desc: 'Collected materials are sold to recycling companies, completing the circular economy loop.',
    icon: Factory,
  },
];

const testimonials = [
  {
    quote: "This platform made recycling simple for our apartment. We schedule pickups every week and actually earn rewards for it!",
    name: 'Priya Sharma',
    role: 'Household User, Hyderabad',
  },
  {
    quote: "Collectors can now earn more with regular pickup jobs. I increased my weekly income by 40% since joining EcoLoop.",
    name: 'Raju Patel',
    role: 'Waste Collector, Pune',
  },
  {
    quote: "As a recycling company, EcoLoop gives us a reliable supply of quality sorted materials. It's transformed our sourcing.",
    name: 'Anand Recyclers',
    role: 'Recycling Company, Mumbai',
  },
];

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>EcoLoop</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#households" className="hover:text-foreground transition-colors">Households</a>
            <a href="#collectors" className="hover:text-foreground transition-colors">Collectors</a>
            <a href="#recyclers" className="hover:text-foreground transition-colors">Recyclers</a>
            <a href="#impact" className="hover:text-foreground transition-colors">Impact</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/signup"><Button size="sm">Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <a href="#how-it-works" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#households" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Households</a>
              <a href="#collectors" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Collectors</a>
              <a href="#recyclers" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Recyclers</a>
              <a href="#impact" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Impact</a>
              <div className="flex gap-3 pt-2 border-t border-border">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Sign In</Button></Link>
                <Link to="/signup" className="flex-1"><Button className="w-full">Get Started</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/40 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6 border border-border">
                <Sparkles className="w-3.5 h-3.5" />
                India's Smart Recycling Platform
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Recycle Smarter.{' '}
                <span className="text-primary">Earn Rewards.</span>{' '}
                Build a Cleaner City.
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                EcoLoop connects households, waste collectors, and recycling companies to make recycling easy and rewarding.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    <Calendar className="w-4 h-4 mr-2" /> Schedule Pickup
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                    <Truck className="w-4 h-4 mr-2" /> Join as Collector
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="w-full aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-primary/10 via-accent to-primary/5 border border-border p-8 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-6 w-full">
                    <div className="bg-card rounded-2xl p-5 shadow-lg border border-border flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Recycle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Recycle</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 shadow-lg border border-border flex flex-col items-center gap-2 translate-y-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Earn</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 shadow-lg border border-border flex flex-col items-center gap-2 -translate-y-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Collect</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 shadow-lg border border-border flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Impact</span>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 bg-card rounded-xl p-3 shadow-xl border border-border flex items-center gap-2"
                >
                  <TreePine className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold">120 Trees Saved</span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="absolute -bottom-4 -left-4 bg-card rounded-xl p-3 shadow-xl border border-border flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold">₹2.5L+ Earned</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Recycling in 3 Simple Steps
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              From scheduling a pickup to recycling — it's all seamless.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="relative text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-5xl font-black text-primary/10 absolute top-0 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 -translate-y-2" style={{ fontFamily: 'Space Grotesk' }}>{s.step}</span>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Households */}
      <section id="households" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">For Households</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk' }}>
                Turn Your Waste Into <span className="text-primary">Rewards</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Schedule pickups, track your environmental impact, and earn cash or reward points for every kilogram you recycle.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Calendar, text: 'Schedule waste pickups easily' },
                  { icon: DollarSign, text: 'Earn cash or eco reward points' },
                  { icon: BarChart3, text: 'Track your recycling impact' },
                  { icon: Heart, text: 'Reduce landfill waste' },
                ].map((f, i) => (
                  <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>
              <Link to="/signup">
                <Button size="lg">Start Recycling <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}
              className="bg-accent/50 rounded-3xl p-8 border border-border"
            >
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Your Impact This Month</span>
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-accent/60 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">25 kg</p>
                    <p className="text-xs text-muted-foreground">Waste Recycled</p>
                  </div>
                  <div className="bg-accent/60 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">₹375</p>
                    <p className="text-xs text-muted-foreground">Rewards Earned</p>
                  </div>
                  <div className="bg-accent/60 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">3</p>
                    <p className="text-xs text-muted-foreground">Trees Saved</p>
                  </div>
                  <div className="bg-accent/60 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">15 kg</p>
                    <p className="text-xs text-muted-foreground">CO₂ Prevented</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Collectors */}
      <section id="collectors" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
              className="order-2 lg:order-1 bg-card rounded-3xl p-8 border border-border shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Gachibowli, Hyderabad</p>
                      <p className="text-xs text-muted-foreground">8 pickups available</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Hot Zone</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Madhapur</p>
                      <p className="text-xs text-muted-foreground">5 pickups available</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-md">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Today's Earnings</p>
                      <p className="text-xs text-muted-foreground">6 pickups completed</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">₹780</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">For Collectors</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk' }}>
                Earn More, <span className="text-primary">Collect Smarter</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Find pickup jobs nearby, optimize your routes, and sell collected waste directly to recycling companies.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: MapPin, text: 'Find pickup jobs nearby' },
                  { icon: TrendingUp, text: 'Increase daily earnings' },
                  { icon: Route, text: 'Optimized pickup routes' },
                  { icon: ShoppingCart, text: 'Sell waste directly to recyclers' },
                ].map((f, i) => (
                  <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>
              <Link to="/signup">
                <Button size="lg">Become a Collector <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Recyclers */}
      <section id="recyclers" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">For Recyclers</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk' }}>
                Reliable Supply, <span className="text-primary">Simplified</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Access a steady stream of sorted, quality recyclable materials directly from collectors on the platform.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: PackageCheck, text: 'Access reliable recyclable material supply' },
                  { icon: ShoppingCart, text: 'Purchase waste directly from collectors' },
                  { icon: BarChart3, text: 'Track orders and inventory' },
                  { icon: Zap, text: 'Expand recycling operations' },
                ].map((f, i) => (
                  <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>
              <Link to="/signup">
                <Button size="lg">Join as Recycler <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}
              className="bg-accent/50 rounded-3xl p-8 border border-border"
            >
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk' }}>Marketplace Preview</span>
                  <Factory className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-3">
                  {[
                    { type: 'Plastic', qty: '120 kg', price: '₹15/kg' },
                    { type: 'Cardboard', qty: '85 kg', price: '₹10/kg' },
                    { type: 'Aluminium', qty: '30 kg', price: '₹80/kg' },
                    { type: 'Paper', qty: '200 kg', price: '₹12/kg' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 rounded-xl bg-accent/60 border border-border">
                      <div>
                        <p className="text-sm font-semibold">{item.type}</p>
                        <p className="text-xs text-muted-foreground">{item.qty} available</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70 mb-3 block">Our Impact</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Building a Cleaner India, Together
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm"
              >
                <s.icon className="w-8 h-8 mx-auto mb-3 text-primary-foreground/80" />
                <p className="text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>{s.value}</p>
                <p className="text-xs text-primary-foreground/70">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* City / Municipality */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">For Cities & Municipalities</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Smarter Waste Management for <span className="text-primary">Your City</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              Partner with EcoLoop to monitor recycling performance and improve sustainability across your municipality.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: BarChart3, title: 'Monitor Performance', desc: 'Real-time recycling analytics and reporting for your city.' },
              { icon: Truck, title: 'Track Collection', desc: 'Monitor waste collection routes and completion rates.' },
              { icon: Globe, title: 'Sustainability Goals', desc: 'Improve sustainability initiatives with data-driven insights.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center p-6 rounded-2xl border border-border bg-card"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              What Our Users Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-12 text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Ready to Make a Difference?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
              Join thousands of households and collectors already recycling smarter with EcoLoop.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="text-base px-8">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>EcoLoop</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                India's smart recycling platform connecting households, collectors, and recyclers for a cleaner future.
              </p>
              <div className="flex gap-3 mt-4">
                {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Platform</h4>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
                <a href="#households" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">For Households</a>
                <a href="#collectors" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">For Collectors</a>
                <a href="#recyclers" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">For Recyclers</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Refund Policy</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" /> support@ecoloop.in
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" /> +91 98765 43210
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinned className="w-4 h-4" /> Hyderabad, India
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">© 2026 EcoLoop. Building a cleaner India, one pickup at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
