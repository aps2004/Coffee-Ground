import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Coffee, MapPin, Compass, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';

const FEATURE_IMAGE = "https://static.prod-images.emergentagent.com/jobs/58221544-2517-4c5a-a9d4-e70eb05364b4/images/a83a575c4e4d7f6dff69e68b93b17cc703278a304c374c745c99e514db713608.png";
const MAP_TEXTURE = "https://static.prod-images.emergentagent.com/jobs/58221544-2517-4c5a-a9d4-e70eb05364b4/images/1b5a042b4d4759c6cd300833903ab180b5be27badc565be53239a2aa3c25bc29.png";

export default function CUKPPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="cukp-page">
      {/* Hero */}
      <section className="relative h-[50vh] overflow-hidden flex items-end" data-testid="cukp-hero">
        <div className="absolute inset-0">
          <img src={MAP_TEXTURE} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/60 to-[#FDFBF7]/20" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pb-12 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[#B55B49] font-medium text-sm tracking-widest uppercase mb-4">About Us</p>
            <h1 className="font-['Cormorant_Garamond'] text-5xl sm:text-6xl font-light text-[#2C1A12] tracking-tight leading-none" data-testid="cukp-title">
              CUKP
            </h1>
            <p className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl italic text-[#6B5744] mt-2">
              The Coffee United Kingdom Project
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-light text-[#2C1A12] mb-6">
                The Quest Begins
              </h2>
              <div className="space-y-5 text-[#2C1A12]/80 leading-relaxed">
                <p>
                  It started, as most great ideas do, over a truly exceptional cup of coffee. In a quiet corner of a tiny roastery in Bath, two friends sat across from each other, hands wrapped around ceramic mugs, and made a pact that would reshape how Britain thinks about its coffee culture.
                </p>
                <p>
                  <span className="font-semibold text-[#2C1A12]">Eleanor Whitfield</span>, a former food journalist who had spent a decade documenting London's restaurant scene, and <span className="font-semibold text-[#2C1A12]">James Hartley</span>, a third-generation tea merchant turned specialty coffee evangelist, shared a conviction: that the UK was experiencing a coffee revolution, one that was happening not in boardrooms or chain franchises, but in the quiet corners of independent shops across the country.
                </p>
                <p>
                  The problem was simple. Nobody was documenting it. Not properly. Not with the love, depth, and editorial rigour these places deserved.
                </p>
              </div>
            </motion.div>

            <Separator className="my-10 bg-[#E8E3D9]" />

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-light text-[#2C1A12] mb-6">
                From Notebook to Coffee Grounds
              </h2>
              <div className="space-y-5 text-[#2C1A12]/80 leading-relaxed">
                <p>
                  In the spring of 2024, Eleanor and James set off with little more than a battered Moleskine notebook, a well-calibrated palate, and a rusted camper van affectionately named "The Grinder." Their mission: visit every notable independent coffee shop in the United Kingdom and tell its story.
                </p>
                <p>
                  The first six months took them from the cobblestoned lanes of Edinburgh's Old Town to the converted shipping containers of Cardiff's waterfront. They drank over 2,000 cups of coffee, interviewed 400 baristas, and slept in The Grinder more nights than either would care to admit.
                </p>
                <p>
                  What began as handwritten tasting notes evolved into something larger. Each shop had a story. Each barista had a philosophy. Each cup was the culmination of a chain stretching from a farmer in Colombia or Ethiopia to the person behind the counter. These weren't just reviews; they were portraits of a movement.
                </p>
                <p>
                  <span className="italic text-[#B55B49] font-medium">Coffee Grounds</span> was born from those notebooks. Named for the rich sediment that remains after the brew, a reminder that the best things leave something behind. What started as a personal project became the UK's most trusted independent coffee guide.
                </p>
              </div>
            </motion.div>

            <Separator className="my-10 bg-[#E8E3D9]" />

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="font-['Cormorant_Garamond'] text-3xl font-light text-[#2C1A12] mb-6">
                The Mission
              </h2>
              <div className="space-y-5 text-[#2C1A12]/80 leading-relaxed">
                <p>
                  The Coffee United Kingdom Project, or <span className="font-semibold text-[#B55B49]">CUKP</span>, is our ongoing quest to discover, document, and celebrate every exceptional coffee shop across these islands. It's more than a directory; it's a living document of British coffee culture at its finest.
                </p>
                <p>
                  We believe that great coffee shops are more than places to get caffeinated. They're community anchors. They're where freelancers find their rhythm, where strangers become friends, where ideas are born between sips. Every listing on Coffee Grounds has been personally visited, tasted, and written about by our team.
                </p>
                <p>
                  The quest is far from over. There are shops tucked in market towns we haven't reached, roasteries in industrial estates we haven't found, and baristas whose stories we haven't yet told. That's what keeps us going. That next great cup is always just around the corner.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-8">
              {/* Feature Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded overflow-hidden border border-[#E8E3D9]"
              >
                <img src={FEATURE_IMAGE} alt="Artisanal coffee" className="w-full h-64 object-cover" />
              </motion.div>

              {/* Stats */}
              <div className="bg-white border border-[#E8E3D9] rounded p-6" data-testid="cukp-stats">
                <h3 className="font-['Cormorant_Garamond'] text-xl text-[#2C1A12] mb-4">The Journey So Far</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#B55B49]/10 flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-[#B55B49]" />
                    </div>
                    <div>
                      <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">2,847</p>
                      <p className="text-xs text-[#6B5744]">Cups tasted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#B55B49]/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#B55B49]" />
                    </div>
                    <div>
                      <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">186</p>
                      <p className="text-xs text-[#6B5744]">Cities visited</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#B55B49]/10 flex items-center justify-center">
                      <Compass className="w-5 h-5 text-[#B55B49]" />
                    </div>
                    <div>
                      <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">12,400</p>
                      <p className="text-xs text-[#6B5744]">Miles driven in The Grinder</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#B55B49]/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[#B55B49]" />
                    </div>
                    <div>
                      <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">423</p>
                      <p className="text-xs text-[#6B5744]">Barista interviews</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="bg-[#2C1A12] rounded p-6" data-testid="cukp-quote">
                <blockquote className="font-['Cormorant_Garamond'] text-xl italic text-white/90 leading-relaxed">
                  "Every great coffee shop has a soul. Our job is simply to find it and share it with the world."
                </blockquote>
                <p className="text-[#D4B996] text-sm mt-4">Eleanor Whitfield, Co-founder</p>
              </div>

              {/* CTA */}
              <Link to="/map" data-testid="cukp-explore-btn">
                <Button className="w-full bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2 font-medium">
                  Explore the Map <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Founders */}
      <section className="bg-[#2C1A12] py-16 px-4 sm:px-8" data-testid="founders-section">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-light text-white tracking-tight mb-10">
            The Founders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded p-6">
              <h3 className="font-['Cormorant_Garamond'] text-2xl text-white mb-2">Eleanor Whitfield</h3>
              <p className="text-[#D4B996] text-sm mb-3">Co-founder & Editor-in-Chief</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Former food journalist for The Guardian and Eater London. Eleanor's decade-long career covering the UK's dining scene sharpened her palate and her pen. She brings editorial rigour and a novelist's eye for detail to every Coffee Grounds write-up. Her flat white order is non-negotiable: single-origin, medium roast, extra hot.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded p-6">
              <h3 className="font-['Cormorant_Garamond'] text-2xl text-white mb-2">James Hartley</h3>
              <p className="text-[#D4B996] text-sm mb-3">Co-founder & Chief Taster</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Third-generation Hartley & Sons tea merchant who shocked his family by defecting to coffee. James's trained palate, inherited from decades of tea cupping, gives him an uncanny ability to dissect flavour profiles. He maintains The Grinder, manages relationships with roasters nationwide, and insists on V60 pour-overs even when camping.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
