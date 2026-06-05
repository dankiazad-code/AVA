import "./App.css";

function App() {
  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">AVA</div>

        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#stats">Stats</a>
          <a href="#contact">Contact</a>
        </div>

        <button className="nav-button">
          Book a Call
        </button>

      </nav>



      {/* HERO */}

      <section className="hero">

        <div className="hero-left">

          <div className="hero-label">
            PREMIUM AI AGENCY
          </div>

          <h1>
            Premium AI
            <br />
            Solutions for
            <br />
            modern businesses.
          </h1>

          <p className="hero-text">
            AVA builds cinematic AI systems, premium websites,
            intelligent automation and high-end digital experiences
            for modern companies that want growth, dominance and trust.
          </p>

          <div className="hero-buttons">

            <button className="primary-btn">
              Start Project
            </button>

            <button className="secondary-btn">
              View Services
            </button>

          </div>

        </div>



        <div className="hero-right">

          <div className="hero-card">

            <h3>AVAILABLE SERVICES</h3>

            <div className="service-line">
              <span>AI Voice Agents</span>
              <span>$49/mo</span>
            </div>

            <div className="service-line">
              <span>Website Creation</span>
              <span>$1800</span>
            </div>

            <div className="service-line">
              <span>Website Optimization</span>
              <span>$900</span>
            </div>

            <div className="service-line">
              <span>Automation Systems</span>
              <span>Custom</span>
            </div>

          </div>

        </div>

      </section>


      {/* SERVICES */}

      <section className="services" id="services">

        <div className="section-label">
          SERVICES
        </div>

        <h2>
          Everything your
          <br />
          business needs
          <br />
          to scale online.
        </h2>

        <div className="services-grid">

          <div className="service-card">

            <h3>
              AI Voice
              <br />
              Agents
            </h3>

            <p>
              Intelligent AI agents that answer calls,
              qualify leads and automate bookings 24/7.
            </p>

            <h4>$59/mo</h4>

          </div>



          <div className="service-card">

            <h3>
              Website
              <br />
              Creation
            </h3>

            <p>
              Premium websites designed for modern
              brands that want performance and trust.
            </p>

            <h4>$1800</h4>

          </div>



          <div className="service-card">

            <h3>
              Automation
              <br />
              Systems
            </h3>

            <p>
              Smart systems that reduce manual work
              and optimize your business operations.
            </p>

            <h4>Custom</h4>

          </div>

        </div>

      </section>



      {/* STATS */}

      <section className="stats-section" id="stats">

        <div className="stat-card">

          <h2>24/7</h2>

          <p>
            AI availability for your business.
          </p>

        </div>



        <div className="stat-card">

          <h2>98%</h2>

          <p>
            Faster response and automation workflows.
          </p>

        </div>



        <div className="stat-card">

          <h2>10x</h2>

          <p>
            Better premium online presence.
          </p>

        </div>

      </section>



      {/* ABOUT */}

      <section className="about" id="about">

        <div className="about-left">

          <div className="section-label">
            ABOUT AVA
          </div>

          <h2>
            We create
            digital systems
            built for
            serious companies.
          </h2>

        </div>



        <div className="about-right">

          <p>
            AVA helps businesses automate communication,
            improve their online presence and increase
            efficiency through AI.
          </p>

          <p>
            Our focus is premium design, intelligent automation
            and long-term growth.
          </p>

        </div>

      </section>



      {/* CTA */}

      <section className="premium-cta">

        <div className="section-label">
          START YOUR PROJECT
        </div>

        <h2>
          Let’s build
          something
          exceptional.
        </h2>

        <p className="cta-text">
          Book a free strategy call today and transform
          your business with premium AI systems.
        </p>

        <div className="cta-buttons">

         <button
  className="primary-btn"
  onClick={() =>
    window.open(
      "https://calendly.com/dankiazad/30min",
      "_blank"
    )
  }
>
  Book Strategy Call
</button>

          <button
  className="secondary-btn"
  onClick={() =>
    document.getElementById("contact")?.scrollIntoView({
      behavior: "smooth",
    })
  }
>
  Contact Us
</button>

        </div>

      </section>



      {/* FOOTER */}

      <footer className="footer" id="contact">

        <div className="footer-left">

          <h2>AVA</h2>

          <p>
            Premium AI Systems for modern businesses.
          </p>

        </div>



        <div className="footer-right">

          <a href="/">Instagram</a>
          <a href="/">LinkedIn</a>
          <a href="/">Contact</a>

        </div>

      </footer>

    </div>
  );
}

export default App;