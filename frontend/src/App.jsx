import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import LandingPage from './pages/Landing';
import Authentication from './pages/Signin';
import Signin from './pages/Signin';
import SignUp from './pages/Signup';
import { AuthProvider } from './context/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';


function App() {
  

  return (
    <>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<LandingPage/>}/>

          

          <Route path='/signin' element={<Signin/>}/>


          <Route path='/signup' element={<SignUp/>}/>

          <Route path='/:url' element={<VideoMeetComponent/>}/>
        </Routes>
      </AuthProvider>
    </Router>
      
    </>
  )
}

export default App
