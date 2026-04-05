"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { generateInterviewQuestions } from "@/actions/mock-interview";
import { Loader2, Mic, Video, VideoOff, MicOff, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InterviewUI() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef("");

  // Start interview and generate questions
  const startInterview = async () => {
    setIsLoading(true);
    try {
      const q = await generateInterviewQuestions();
      setQuestions(q);
      
      // Initialize Camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
      } catch (camErr) {
        toast.error("Camera/Mic permission denied or unavailable.");
        // We can continue but it's better to log it
        console.error(camErr);
      }

      setHasStarted(true);
    } catch (error) {
      toast.error(error.message || "Failed to start interview");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in your browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptBufferRef.current += event.results[i][0].transcript + " ";
        } else {
          currentTranscript += event.results[i][0].transcript;
        }
      }
      setLiveTranscript(transcriptBufferRef.current + currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    recognitionRef.current = recognition;
  };

  useEffect(() => {
    initSpeechRecognition();
    return () => stopMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onVideoRef = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch(console.error);
    }
  };

  useEffect(() => {
    if (hasStarted && !isFinished && questions.length > 0) {
      const questionText = questions[currentIndex];
      setLiveTranscript(""); // Reset visual transcript
      
      let isRecordingStarted = false;
      const safeStartRecording = () => {
        if (!isRecordingStarted) {
          isRecordingStarted = true;
          startRecording();
        }
      };
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(questionText);
        
        utterance.onend = safeStartRecording;
        utterance.onerror = safeStartRecording;
        
        window.speechSynthesis.speak(utterance);
        
        // Safety Fallback: Browsers block speech synthesis if not directly triggered by user click (awaiting Gemini breaks this user gesture)
        // Force recording to start after 3 seconds otherwise it will hang forever waiting for utterance.onend
        setTimeout(safeStartRecording, 3000);
      } else {
        safeStartRecording();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, hasStarted, isFinished, questions]);

  const startRecording = () => {
    transcriptBufferRef.current = ""; // Reset buffer
    try {
      if (recognitionRef.current) {
         recognitionRef.current.start();
         setIsRecording(true);
      }
    } catch(err) {
      // Ignore start errors (like if it's already started)
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const nextQuestion = () => {
    // 1. Stop recording and save answer
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    setIsRecording(false);
    
    const finalizeAnswer = () => {
        const finalAnswer = transcriptBufferRef.current.trim();
        const currentAnswers = [...answers];
        currentAnswers[currentIndex] = finalAnswer || "No answer recorded.";
        setAnswers(currentAnswers);
        
        // 2. Move next OR finish
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          finishInterview();
        }
    };

    // Give a little time for final results to process
    setTimeout(finalizeAnswer, 500);
  };

  const finishInterview = () => {
    // Save last answer if finishing early
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    const finalAnswer = transcriptBufferRef.current.trim();
    if (currentIndex < answers.length || answers.length === questions.length - 1) {
        const currentAnswers = [...answers];
        currentAnswers[currentIndex] = finalAnswer || "No answer recorded.";
        setAnswers(currentAnswers);
    }
    
    stopMedia();
    setIsFinished(true);
  };

  if (!hasStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-12">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gradient">Mock Interview Simulation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-6">
          <div className="bg-muted p-8 rounded-full">
             <Video className="w-16 h-16 text-primary" />
          </div>
          <p className="text-muted-foreground text-center max-w-md">
            Practice your interview skills with real-time AI generated questions based on your industry. 
            Ensure your camera and microphone are working.
          </p>
          <Button onClick={startInterview} disabled={isLoading} size="lg" className="px-8 mt-4">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Start Interview"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-4xl mx-auto my-12 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-green-500">
               Great job completing the mock interview!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-center text-muted-foreground">
               Here is a summary of the questions asked and your transcribed responses.
            </p>
            <div className="space-y-6">
               {questions.map((q, idx) => (
                 <div key={idx} className="p-6 border rounded-lg bg-card shadow-sm">
                   <h3 className="font-semibold text-lg mb-2">Q{idx + 1}: {q}</h3>
                   <div className="mt-2 text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-md">
                     <span className="font-medium text-foreground">Your Answer: </span>
                     {answers[idx] || "No answer recorded."}
                   </div>
                 </div>
               ))}
            </div>
            <div className="mt-8 text-center flex justify-center gap-4">
               <Button onClick={() => window.location.reload()} variant="outline">
                 Try Again
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto my-8 gap-6 grid grid-cols-1 md:grid-cols-2">
      {/* Left side: Camera View */}
      <Card className="flex flex-col h-full bg-black/5 border-muted overflow-hidden">
        <div className="relative flex-grow min-h-[400px] bg-black rounded-t-lg flex items-center justify-center">
            <video
              ref={onVideoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }} // mirror the video
            />
            {/* Visual indicator for recording */}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 text-red-500 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                Recording
              </div>
            )}
        </div>
        <div className="p-4 bg-muted/50 border-t flex justify-center gap-4">
           {isRecording ? <Mic className="w-5 h-5 text-green-500" /> : <MicOff className="w-5 h-5 text-red-500" />}
           <Video className="w-5 h-5 text-green-500" />
        </div>
      </Card>

      {/* Right side: Questions & Controls */}
      <Card className="flex flex-col h-full shadow-lg">
        <CardHeader className="border-b space-y-1">
           <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
             <span>Question {currentIndex + 1} of {questions.length}</span>
             <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs animate-pulse">
                Speaking...
             </span>
           </div>
           <CardTitle className="text-2xl leading-tight">
             {questions[currentIndex]}
           </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 flex-grow flex flex-col justify-between space-y-8">
           <div className="flex-grow flex flex-col justify-center min-h-[150px] bg-muted/30 p-4 rounded-lg">
             {liveTranscript ? (
               <p className="text-foreground text-lg text-center tracking-wide">{liveTranscript}</p>
             ) : (
               <p className="text-muted-foreground italic text-center">
                 "Answer verbally. The system is listening and recording your response..."
               </p>
             )}
           </div>
           
           <div className="grid grid-cols-2 gap-4 mt-8">
              <Button 
                 variant="destructive" 
                 size="lg" 
                 onClick={finishInterview}
                 className="w-full flex gap-2"
              >
                 <StopCircle className="w-4 h-4" />
                 Submit Early
              </Button>
              <Button 
                onClick={nextQuestion} 
                size="lg"
                className="w-full"
              >
                 {currentIndex === questions.length - 1 ? "Finish Interview" : "Next Question"}
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
