import withAuth from '@/utils/withAuth'
import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext} from '@/context/AuthContext';




function HomeComponent() {
    const navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState("");

    const {addToUserHistory} = useContext(AuthContext);

    let handlejoinVideoCall= async()=>{
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }
  return (
    <>
        <div className='navBar'>

            <div style={{display: "flex",  alignItems:"center"}}>
                <h2>Instant  video call</h2>

            </div>
            <div style={{display: "flex", alignItems:"center"}}>
                <IconButton onClick={
                    ()=> {
                        navigate("/history")
                    }
                }>
                    <RestoreIcon/>
                    <p>History</p>
                </IconButton>
                <Button onClick={()=>{
                    localStorage.removeItem("token")
                    navigate("/")

                }}>
                    Logout
                </Button>

            </div>

        </div>
        <div className='meetContainer'>
            <div className='leftPanel'>
                <div>
                    <h2>providing quality Video call</h2>

                    <div style={{display: "flex", gap:"10px"}}>

                        <TextField onChange={e => setMeetingCode(e.target.value)} id='outlined-basic' label="Meeting-code" variant='outlined'>

                        </TextField>
                        <Button onClick={handlejoinVideoCall} variant='contained'>Join</Button>
                    </div>

                </div>

            </div>
            <div className='rightPanel'>
                <img srcSet='/home.png' alt=''/>

            </div>

        </div>
    </>
  )
}

export default withAuth(HomeComponent);
