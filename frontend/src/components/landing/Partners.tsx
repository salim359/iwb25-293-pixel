import logo1 from "../../assets/logo1.svg";
import logo2 from "../../assets/logo2.svg";
import logo3 from "../../assets/logo3.svg";
import logo4 from "../../assets/logo4.svg";
import logo5 from "../../assets/logo5.svg";
import logo6 from "../../assets/logo6.svg";
import logo7 from "../../assets/logo7.svg";

const logos = [logo1, logo2, logo3, logo4, logo5, logo6, logo7];

export default function Partners() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" id="partners">
      <style>
        
      </style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Trusted by Industry Leaders
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 text-transparent bg-clip-text mb-6">
            Our Partners
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Building the future together with world-class organizations that
            share our vision
          </p>
        </div>

        {/* Partners Grid */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling container */}
          <div className="overflow-hidden">
            <div className="flex animate-scroll-infinite gap-12 items-center justify-center py-8">
              {/* First set of logos */}
              {logos.map((logo, index) => (
                <div
                  key={`first-${index}`}
                  className="flex-shrink-0 group cursor-pointer"
                >
                  <div className="relative p-6 rounded-2xl bg-card shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                    <img
                      src={logo}
                      alt={`Partner ${index + 1}`}
                      className="h-12 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                    />
                  </div>
                </div>
              ))}

              {/* Duplicate set for infinite scroll */}
              {logos.map((logo, index) => (
                <div
                  key={`second-${index}`}
                  className="flex-shrink-0 group cursor-pointer"
                >
                  <div className="relative p-6 rounded-2xl bg-card shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                    <img
                      src={logo}
                      alt={`Partner ${index + 1}`}
                      className="h-12 w-auto object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats or CTA */}
        <div className="text-center mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Growing network of 50+ partners</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Serving 100k+ professionals globally</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
