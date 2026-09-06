import React from 'react'
import "../App.css";
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>Instant</h2>
        </div>

        
        <div className='navlist'>
          <p>Join as Guest</p>
          <p>Register</p>
          <div role="button">
            <p>Login</p>

          </div>

        </div>
      </nav>

      <div className="landingMainConntainer">
        <div>
          <h1><span style={{color:"#FF9839"}}>Connect</span> With your loved ones</h1>

          <p>Cover a distance with Instant</p>
          <div role='button'>
            <Link to={"/auth"}>Get started</Link>
          </div>
        </div>
        <div>
          <img src='../Frame 1 (1).png'/>
        </div>
      </div>
        

      </div>
     
    
  )
}
