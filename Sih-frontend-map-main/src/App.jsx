import RiskMap from "./components/RiskMap";
import "./index.css";

function App() {

  return (

    <div className="app">

      <header className="map-header">

        <div className="brand">

          <div className="brand-icon">
            ✦
          </div>

          <div>

            <h1>
              DISASTERGUARD AI
            </h1>

            <p>
              AI-POWERED EARLY WARNING SYSTEM
            </p>

          </div>

        </div>


        <div className="header-title">

          <span className="red-dot">
            ●
          </span>

          LIVE RISK MAP

          <span className="separator">
            |
          </span>

          <span className="district">
            Rudraprayag District ·
            Uttarakhand
          </span>

        </div>


        <div className="live">

          <span className="live-dot">
          </span>

          LIVE

          <span className="system">
            All systems operational
          </span>

        </div>

      </header>


      <main className="map-wrapper">

        <RiskMap />

      </main>

    </div>

  );
}

export default App;