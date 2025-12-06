export default function About() {
  return (
    <div className="about-container">
      <h1 className="about-title">About SkyMatrix</h1>

      <div className="about-boxes">
        <div className="about-box">
          <h2>Our Mission</h2>
          <p>
            At SkyMatrix, we aim to redefine air travel management with cutting-edge technology that makes booking, scheduling, and managing flights seamless. We focus on reliability, efficiency, and an intuitive user experience that empowers both travelers and airline operators alike.
          </p>
        </div>

        <div className="about-box">
          <h2>Advanced Technology</h2>
          <p>
            SkyMatrix leverages real-time data analytics and AI-driven insights to optimize flight routes, track schedules, and enhance safety protocols. Our platform ensures airlines operate smoothly while passengers enjoy a hassle-free and modern flight experience.
          </p>
        </div>

        <div className="about-box">
          <h2>Customer-Centric</h2>
          <p>
            We put our customers first, providing a seamless interface for travelers to book flights, manage itineraries, and access support anytime. SkyMatrix is committed to creating a trustworthy, efficient, and pleasant travel experience for everyone, every time they fly.
          </p>
        </div>
         <div className="about-box">
          <h2>Global Connectivity</h2>
          <p>
            SkyMatrix connects airlines and passengers across the globe, ensuring smooth travel experiences wherever you fly. With our integrated platform, scheduling and connecting flights has never been easier or more reliable.
          </p>
        </div>

        <div className="about-box">
          <h2>Safety First</h2>
          <p>
            Safety is at the core of everything we do. SkyMatrix implements strict safety protocols, advanced monitoring, and predictive maintenance features to ensure that every flight is secure and on time.
          </p>
        </div>

        <div className="about-box">
          <h2>Sustainable Travel</h2>
          <p>
            We are committed to sustainable air travel. SkyMatrix helps airlines optimize routes, reduce fuel consumption, and minimize environmental impact, making flying not only efficient but also eco-friendly.
          </p>
        </div>
      </div>

      {/* Inline CSS */}
      <style>{`
        .about-container {
          height: 120vh;
          width:100vw;
          padding: 4rem 2rem;
          background: linear-gradient(to bottom, #e0f7ff, #f0f9ff);
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .about-title {
          font-size: 3rem;
          color: #0c4a6e;
          font-weight: 800;
          margin-bottom: 3rem;
          letter-spacing: 1px;
          text-align: center;
        }

        .about-boxes {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: center;
          width: 100%;
          max-width: 1200px;
        }

        .about-box {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 300px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .about-box:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }

        .about-box h2 {
          font-size: 1.75rem;
          color: #0369a1;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .about-box p {
          font-size: 1rem;
          color: #374151;
          line-height: 1.7;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .about-box {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
