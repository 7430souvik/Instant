import React, { useEffect, useRef, useState } from "react";
import "../styles/videoComponent.css";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";

const server_url = "http://localhost:8000";

const peerConfigConnections = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

export default function VideoMeetComponent() {

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);

    const localVideoRef = useRef(null);

    // Keep WebRTC connections inside a ref
    const connections = useRef({});

    // Keep remote videos in a ref as well
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);

    const [video, setVideo] = useState(undefined);
    const [audio, setAudio] = useState(undefined);

    const [screen, setScreen] = useState(undefined);
    const [showModel, setShowModel] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    const [askForUsername, setAskUsername] = useState(true);
    const [userName, setUsername] = useState("");

    const [videos, setVideos] = useState([]);


    // --------------------------------------------------
    // GET PERMISSIONS
    // --------------------------------------------------

    const getPermissions = async () => {

        try {

            const videoPermission =
                await navigator.mediaDevices.getUserMedia({
                    video: true
                });

            if (videoPermission) {
                setVideoAvailable(true);

                videoPermission
                    .getTracks()
                    .forEach(track => track.stop());

            } else {
                setVideoAvailable(false);
            }

        } catch (err) {

            console.log("Video permission error:", err);
            setVideoAvailable(false);

        }


        try {

            const audioPermission =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            if (audioPermission) {
                setAudioAvailable(true);

                audioPermission
                    .getTracks()
                    .forEach(track => track.stop());

            } else {
                setAudioAvailable(false);
            }

        } catch (err) {

            console.log("Audio permission error:", err);
            setAudioAvailable(false);

        }


        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    };


    useEffect(() => {

        getPermissions();

        return () => {

            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            Object.values(connections.current).forEach(connection => {
                try {
                    connection.close();
                } catch (e) {
                    console.log(e);
                }
            });

            if (window.localStream) {
                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());
            }
        };

    }, []);


    // --------------------------------------------------
    // USER MEDIA SUCCESS
    // --------------------------------------------------

    const getUserMediaSuccess = (stream) => {

        console.log("LOCAL STREAM RECEIVED:", stream);

        try {

            if (window.localStream) {

                window.localStream
                    .getTracks()
                    .forEach(track => track.stop());

            }

        } catch (e) {

            console.log(e);

        }


        window.localStream = stream;


        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }


        // Add new tracks to existing peer connections
        Object.keys(connections.current).forEach(peerId => {

            const connection = connections.current[peerId];

            if (!connection) {
                return;
            }


            stream.getTracks().forEach(track => {

                try {

                    connection.addTrack(
                        track,
                        stream
                    );

                } catch (error) {

                    console.log(
                        "Track already added:",
                        error
                    );

                }

            });


            connection
                .createOffer()
                .then(offer => {

                    return connection.setLocalDescription(
                        offer
                    );

                })
                .then(() => {

                    if (socketRef.current) {

                        socketRef.current.emit(
                            "signal",
                            peerId,
                            JSON.stringify({
                                sdp: connection.localDescription
                            })
                        );

                    }

                })
                .catch(error => {

                    console.error(
                        "Offer creation error:",
                        error
                    );

                });

        });


        // Handle tracks ending
        stream.getTracks().forEach(track => {

            track.onended = () => {

                console.log(
                    "Track ended:",
                    track.kind
                );

                if (track.kind === "video") {
                    setVideo(false);
                }

                if (track.kind === "audio") {
                    setAudio(false);
                }

            };

        });

    };


    // --------------------------------------------------
    // GET USER MEDIA
    // --------------------------------------------------

    const getUserMedia = () => {

        if (!videoAvailable && !audioAvailable) {

            console.log(
                "No camera or microphone available"
            );

            return;

        }


        navigator.mediaDevices
            .getUserMedia({
                video: videoAvailable,
                audio: audioAvailable
            })
            .then(getUserMediaSuccess)
            .catch(error => {

                console.error(
                    "getUserMedia error:",
                    error
                );

            });

    };


    useEffect(() => {

        if (
            video !== undefined &&
            audio !== undefined
        ) {

            getUserMedia();

        }

    }, [video, audio]);


    // --------------------------------------------------
    // WEBRTC SIGNALING
    // --------------------------------------------------

    const gotMessageFromServer = async (
        fromId,
        message
    ) => {

        console.log(
            "SIGNAL RECEIVED FROM:",
            fromId
        );


        if (fromId === socketIdRef.current) {
            return;
        }


        const signal = JSON.parse(message);

        const connection =
            connections.current[fromId];


        if (!connection) {

            console.error(
                "No peer connection for:",
                fromId
            );

            return;

        }


        try {

            // ----------------------------
            // SDP
            // ----------------------------

            if (signal.sdp) {

                console.log(
                    "SDP RECEIVED:",
                    signal.sdp.type
                );


                await connection.setRemoteDescription(
                    new RTCSessionDescription(
                        signal.sdp
                    )
                );


                // Received an offer
                if (
                    signal.sdp.type === "offer"
                ) {

                    const answer =
                        await connection.createAnswer();


                    await connection.setLocalDescription(
                        answer
                    );


                    console.log(
                        "SENDING ANSWER TO:",
                        fromId
                    );


                    socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                            sdp:
                                connection.localDescription
                        })
                    );

                }

            }


            // ----------------------------
            // ICE
            // ----------------------------

            if (signal.ice) {

                console.log(
                    "ICE RECEIVED FROM:",
                    fromId
                );


                try {

                    await connection.addIceCandidate(
                        new RTCIceCandidate(
                            signal.ice
                        )
                    );

                } catch (error) {

                    console.error(
                        "ICE candidate error:",
                        error
                    );

                }

            }

        } catch (error) {

            console.error(
                "WebRTC signaling error:",
                error
            );

        }

    };


    // --------------------------------------------------
    // CREATE OFFER
    // --------------------------------------------------

    const createOffer = async (peerId) => {

        const connection =
            connections.current[peerId];


        if (!connection) {
            return;
        }


        try {

            console.log(
                "CREATING OFFER FOR:",
                peerId
            );


            const offer =
                await connection.createOffer();


            await connection.setLocalDescription(
                offer
            );


            console.log(
                "SENDING OFFER TO:",
                peerId
            );


            socketRef.current.emit(
                "signal",
                peerId,
                JSON.stringify({
                    sdp:
                        connection.localDescription
                })
            );

        } catch (error) {

            console.error(
                "Create offer error:",
                error
            );

        }

    };


    // --------------------------------------------------
    // CONNECT SOCKET.IO
    // --------------------------------------------------

    const connectTOSocketServer = () => {

        if (socketRef.current) {
            return;
        }


        socketRef.current =
            io(server_url, {
                transports: ["websocket", "polling"]
            });


        // ----------------------------
        // SIGNAL
        // ----------------------------

        socketRef.current.on(
            "signal",
            gotMessageFromServer
        );


        // ----------------------------
        // CONNECT
        // ----------------------------

        socketRef.current.on(
            "connect",
            () => {

                socketIdRef.current =
                    socketRef.current.id;


                console.log(
                    "SOCKET CONNECTED:",
                    socketIdRef.current
                );


                socketRef.current.emit(
                    "join-call",
                    window.location.href
                );

            }
        );


        // ----------------------------
        // USER LEFT
        // ----------------------------

        socketRef.current.on(
            "user-left",
            (id) => {

                console.log(
                    "USER LEFT:",
                    id
                );


                if (connections.current[id]) {

                    try {
                        connections.current[id].close();
                    } catch (e) {
                        console.log(e);
                    }

                    delete connections.current[id];

                }


                setVideos(currentVideos => {

                    const updatedVideos =
                        currentVideos.filter(
                            video =>
                                video.socketId !== id
                        );


                    videoRef.current =
                        updatedVideos;


                    return updatedVideos;

                });

            }
        );


        // ----------------------------
        // USER JOINED
        // ----------------------------

        socketRef.current.on(
            "user-joined",
            (id, clients) => {

                console.log(
                    "USER JOINED:",
                    id
                );

                console.log(
                    "CLIENTS:",
                    clients
                );

                console.log(
                    "MY SOCKET ID:",
                    socketIdRef.current
                );


                clients.forEach(
                    (socketListId) => {


                        // Don't connect to ourselves
                        if (
                            socketListId ===
                            socketIdRef.current
                        ) {

                            return;

                        }


                        console.log(
                            "CREATING PEER CONNECTION:",
                            socketListId
                        );


                        // ----------------------------
                        // CREATE PEER CONNECTION
                        // ----------------------------

                        const connection =
                            new RTCPeerConnection(
                                peerConfigConnections
                            );


                        connections.current[
                            socketListId
                        ] = connection;


                        // ----------------------------
                        // ICE CANDIDATE
                        // ----------------------------

                        connection.onicecandidate =
                            (event) => {

                                if (
                                    event.candidate
                                ) {

                                    socketRef.current.emit(
                                        "signal",
                                        socketListId,
                                        JSON.stringify({
                                            ice:
                                                event.candidate
                                        })
                                    );

                                }

                            };


                        // ----------------------------
                        // REMOTE TRACK
                        // ----------------------------

                        connection.ontrack =
                            (event) => {

                                console.log(
                                    "REMOTE TRACK RECEIVED FROM:",
                                    socketListId
                                );


                                const stream =
                                    event.streams[0];


                                if (!stream) {

                                    console.log(
                                        "No remote stream"
                                    );

                                    return;

                                }


                                setVideos(
                                    currentVideos => {

                                        const existingVideo =
                                            currentVideos.find(
                                                video =>
                                                    video.socketId ===
                                                    socketListId
                                            );


                                        // Existing video
                                        if (
                                            existingVideo
                                        ) {

                                            const updatedVideos =
                                                currentVideos.map(
                                                    video =>
                                                        video.socketId ===
                                                        socketListId
                                                            ? {
                                                                ...video,
                                                                stream:
                                                                    stream
                                                            }
                                                            : video
                                                );


                                            videoRef.current =
                                                updatedVideos;


                                            return updatedVideos;

                                        }


                                        // New video
                                        const newVideo = {
                                            socketId:
                                                socketListId,
                                            stream:
                                                stream
                                        };


                                        const updatedVideos =
                                            [
                                                ...currentVideos,
                                                newVideo
                                            ];


                                        videoRef.current =
                                            updatedVideos;


                                        return updatedVideos;

                                    }
                                );

                            };


                        // ----------------------------
                        // CONNECTION STATE
                        // ----------------------------

                        connection.onconnectionstatechange =
                            () => {

                                console.log(
                                    "CONNECTION STATE:",
                                    socketListId,
                                    connection.connectionState
                                );

                            };


                        // ----------------------------
                        // ICE CONNECTION STATE
                        // ----------------------------

                        connection.oniceconnectionstatechange =
                            () => {

                                console.log(
                                    "ICE STATE:",
                                    socketListId,
                                    connection.iceConnectionState
                                );

                            };


                        // ----------------------------
                        // ADD LOCAL STREAM
                        // ----------------------------

                        if (
                            window.localStream
                        ) {

                            console.log(
                                "ADDING LOCAL STREAM TO:",
                                socketListId
                            );


                            window.localStream
                                .getTracks()
                                .forEach(
                                    track => {

                                        connection.addTrack(
                                            track,
                                            window.localStream
                                        );

                                    }
                                );

                        }


                        // ----------------------------
                        // CREATE OFFER
                        // ----------------------------

                        if (
                            id ===
                            socketIdRef.current
                        ) {

                            createOffer(
                                socketListId
                            );

                        }

                    }
                );

            }
        );


        // ----------------------------
        // ERROR
        // ----------------------------

        socketRef.current.on(
            "connect_error",
            (error) => {

                console.error(
                    "Socket connection error:",
                    error
                );

            }
        );

    };


    // --------------------------------------------------
    // MEDIA SETTINGS
    // --------------------------------------------------

    const getMedia = () => {

        setVideo(videoAvailable);
        setAudio(audioAvailable);

    };


    // --------------------------------------------------
    // CONNECT BUTTON
    // --------------------------------------------------

    const connect = () => {

        setAskUsername(false);

        getMedia();

        connectTOSocketServer();

    };


    // --------------------------------------------------
    // DEBUG
    // --------------------------------------------------

    console.log(
        "VIDEOS:",
        videos
    );


    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div>

            {askForUsername ? (

                <div>

                    <h2>
                        Enter into Lobby
                    </h2>


                    <Textarea
                        id="outlined-basic"
                        label="Outlined"
                        variant="outlined"
                        value={userName}
                        onChange={
                            e =>
                                setUsername(
                                    e.target.value
                                )
                        }
                    />


                    <Button
                        onClick={connect}
                    >
                        Connect
                    </Button>


                    <div>

                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                        />

                    </div>

                </div>

            ) : (

                <>

                    {/* LOCAL VIDEO */}

                    <div>

                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                        />

                    </div>


                    {/* REMOTE VIDEOS */}

                    <div>

                        {videos.map(
                            (video) => (

                                <div
                                    key={
                                        video.socketId
                                    }
                                >

                                    <h2>
                                        {video.socketId}
                                    </h2>


                                    <video
                                        autoPlay
                                        playsInline
                                        ref={
                                            element => {

                                                if (
                                                    element &&
                                                    video.stream
                                                ) {

                                                    element.srcObject =
                                                        video.stream;

                                                }

                                            }
                                        }
                                    />

                                </div>

                            )
                        )}

                    </div>

                </>

            )}

        </div>
    );
}