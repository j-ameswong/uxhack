import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card.jsx";
import { Button } from "./ui/button.jsx";
import { Badge } from "./ui/badge.jsx";
import {
  MousePointerClick,
  Smartphone,
  Users,
  Download,
  HeartCrack,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function NavLink({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-none"
      style={{ fontFamily: FONT, fontSize: "0.875rem" }}
    >
      {children}
    </button>
  );
}

function FeatureCard({ icon: Icon, title, description, onClick }) {
  return (
    <Card
      className="backdrop-blur-sm bg-white/60 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
      style={{ borderRadius: "0.75rem" }}
    >
      <CardContent className="pt-6 pb-4 px-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3
          className="text-lg font-semibold text-gray-800 mb-2"
          style={{ fontFamily: FONT }}
        >
          {title}
        </h3>
        <p
          className="text-gray-500 text-sm mb-3"
          style={{ fontFamily: FONT, lineHeight: 1.6 }}
        >
          {description}
        </p>
        <button
          onClick={onClick}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
          style={{ fontFamily: FONT }}
        >
          Learn more <ArrowRight className="w-3 h-3" />
        </button>
      </CardContent>
    </Card>
  );
}

function PricingCard({ tier, price, period, features, cta, highlighted, onClick }) {
  return (
    <Card
      className={`backdrop-blur-sm border-0 shadow-lg rounded-xl relative ${
        highlighted ? "bg-white/90 ring-2 ring-indigo-500" : "bg-white/60"
      }`}
      style={{ borderRadius: "0.75rem" }}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle
          className="text-lg font-semibold text-gray-800"
          style={{ fontFamily: FONT, fontSize: "1.125rem" }}
        >
          {tier}
        </CardTitle>
        <div className="mt-2">
          <span
            className="text-4xl font-bold text-gray-900"
            style={{ fontFamily: FONT }}
          >
            {price}
          </span>
          {period && (
            <span
              className="text-gray-500 text-sm ml-1"
              style={{ fontFamily: FONT }}
            >
              {period}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-gray-600"
              style={{ fontFamily: FONT }}
            >
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-6 pb-6">
        <Button
          onClick={onClick}
          className={`w-full ${
            highlighted
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
          style={{ fontFamily: FONT, fontSize: "0.875rem", borderRadius: "0.375rem" }}
        >
          {cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const go = () => navigate("/signup");

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ fontFamily: FONT }}
    >
      {/* ── Background ── */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 -z-10" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* ── Navbar ── */}
      <nav className="w-full backdrop-blur-md bg-white/40 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <HeartCrack className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Likeable</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <NavLink onClick={go}>Features</NavLink>
            <NavLink onClick={go}>Pricing</NavLink>
            <NavLink onClick={go}>About</NavLink>
            <Button
              onClick={go}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              style={{ fontFamily: FONT, fontSize: "0.875rem", borderRadius: "0.375rem" }}
            >
              Get Started
            </Button>
          </div>
          <Button
            onClick={go}
            className="md:hidden bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            style={{ borderRadius: "0.375rem" }}
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <Badge
          className="mb-6 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer"
          onClick={go}
        >
          <Zap className="w-3 h-3 mr-1" /> Now in public beta
        </Badge>
        <h1
          className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          style={{ fontFamily: FONT }}
        >
          Design websites
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            visually.
          </span>
        </h1>
        <p
          className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto"
          style={{ fontFamily: FONT, lineHeight: 1.6 }}
        >
          The intuitive drag-and-drop website builder that lets you create
          stunning, responsive websites without writing a single line of code.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={go}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-3 text-base"
            style={{ fontFamily: FONT, borderRadius: "0.5rem" }}
          >
            Start Building — It&apos;s Free
          </Button>
          <Button
            onClick={go}
            variant="outline"
            size="lg"
            className="border-gray-300 bg-white hover:bg-white px-8 py-3 text-base"
            style={{ fontFamily: FONT, borderRadius: "0.5rem" }}
          >
            Watch Demo
          </Button>
        </div>

        {/* Decorative mockup */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card
            className="backdrop-blur-sm bg-white/50 border-0 shadow-2xl rounded-xl overflow-hidden"
            style={{ borderRadius: "0.75rem" }}
          >
            <div className="h-8 bg-gray-100/80 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-8">
                <div className="h-4 bg-gray-200/80 rounded-full max-w-xs mx-auto" />
              </div>
            </div>
            <div className="p-8 grid grid-cols-12 gap-4 min-h-[280px]">
              {/* Fake sidebar */}
              <div className="col-span-3 space-y-3">
                <div className="h-4 bg-indigo-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded w-3/5" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded w-2/5" />
                <div className="mt-6 h-4 bg-indigo-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
              {/* Fake canvas */}
              <div className="col-span-9 border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col gap-4">
                <div className="h-8 bg-gradient-to-r from-indigo-200 to-purple-200 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
                <div className="flex gap-3 mt-2">
                  <div className="h-20 bg-indigo-100 rounded flex-1" />
                  <div className="h-20 bg-purple-100 rounded flex-1" />
                  <div className="h-20 bg-pink-100 rounded flex-1" />
                </div>
                <div className="h-10 bg-gradient-to-r from-indigo-300 to-purple-300 rounded w-1/3 mt-auto" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2
            className="text-3xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: FONT }}
          >
            Everything you need to build
          </h2>
          <p
            className="text-gray-500 max-w-xl mx-auto"
            style={{ fontFamily: FONT }}
          >
            Powerful tools that make website design accessible to everyone —
            from beginners to professionals.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={MousePointerClick}
            title="Drag & Drop"
            description="Build layouts intuitively by dragging components directly onto your canvas."
            onClick={go}
          />
          <FeatureCard
            icon={Smartphone}
            title="Responsive Design"
            description="Every site automatically adapts to mobile, tablet, and desktop screens."
            onClick={go}
          />
          <FeatureCard
            icon={Users}
            title="Real-Time Collaboration"
            description="Work together with your team in real time — see changes as they happen."
            onClick={go}
          />
          <FeatureCard
            icon={Download}
            title="One-Click Export"
            description="Export clean, production-ready code with a single click."
            onClick={go}
          />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2
            className="text-3xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: FONT }}
          >
            Simple, transparent pricing
          </h2>
          <p
            className="text-gray-500 max-w-xl mx-auto"
            style={{ fontFamily: FONT }}
          >
            Start free and scale as you grow. No hidden fees.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard
            tier="Free"
            price="$0"
            period="/month"
            features={[
              "1 project",
              "Basic components",
              "Community support",
              "Likeable subdomain",
            ]}
            cta="Start Free"
            onClick={go}
          />
          <PricingCard
            tier="Pro"
            price="$19"
            period="/month"
            highlighted
            features={[
              "Unlimited projects",
              "Premium components",
              "Priority support",
              "Custom domain",
              "Team collaboration",
            ]}
            cta="Get Started"
            onClick={go}
          />
          <PricingCard
            tier="Enterprise"
            price="Custom"
            features={[
              "Everything in Pro",
              "SSO & SAML",
              "Dedicated account manager",
              "SLA guarantee",
              "On-premise option",
            ]}
            cta="Contact Sales"
            onClick={go}
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/30 backdrop-blur-sm bg-white/20 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <HeartCrack className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700 text-sm">
              Likeable
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <button onClick={go} className="hover:text-gray-800 cursor-pointer bg-transparent border-none" style={{ fontFamily: FONT }}>Privacy</button>
            <button onClick={go} className="hover:text-gray-800 cursor-pointer bg-transparent border-none" style={{ fontFamily: FONT }}>Terms</button>
            <button onClick={go} className="hover:text-gray-800 cursor-pointer bg-transparent border-none" style={{ fontFamily: FONT }}>Blog</button>
            <button onClick={go} className="hover:text-gray-800 cursor-pointer bg-transparent border-none" style={{ fontFamily: FONT }}>Careers</button>
          </div>
          <p className="text-xs text-gray-400" style={{ fontFamily: FONT }}>
            &copy; 2026 Likeable, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
