
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Video, Sparkles, Zap, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { localDbOperations as dbOperations } from "@/lib/api-client";
import { authUtils } from "@/lib/auth";
import { azureAI, AzureAIAnalysis } from "@/lib/azure-ai";
import { transcribeAudio } from "@/lib/transcribe";
import { getLocalStorage } from "@/lib/local-storage";
import { getAzureStorage } from "@/lib/azure-storage";
import { MediaCompressor } from "@/lib/media-compression";
import { LocationService, LocationData } from "@/lib/location";
import { Mp3AudioHelper } from "@/lib/audio-utils";
import { extractAudioFromVideo } from "@/lib/video-utils";
import { createSpeechRecognizer } from "@/lib/azure-speech";

const CATEGORY_OPTIONS = ["Noodles", "Snacks"];

const BRAND_OPTIONS: Record<string, string[]> = {
  Noodles: [
    "Indomie",
    "Golden Penny",
    "Dangote",
    "Honeywell",
    "Supreme",
    "Tummy Tummy",
    "Mimee",
    "Chikki",
    "Minimie",
    "Good Mama",
  ],
  Snacks: [
    "Gala",
    "Bigi",
    "Beloxxi",
    "Nasco",
    "McVitie's",
    "Rite Foods",
    "Minimie",
    "Kellogg's",
    "Cadbury",
    "Nestle",
    "Oreo",
    "Pringles",
    "Lays",
    "Chi",
    "PepsiCo",
  ],
};

const initialFormState = {
  product: "",
  brand: "",
  category: CATEGORY_OPTIONS[0],
  spend: "",
  companions: "",
  location: "",
  notes: "",
};

const LogConsumption = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<AzureAIAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [captureMethod, setCaptureMethod] = useState<'manual' | 'ai'>('ai');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [categories] = useState<string[]>(CATEGORY_OPTIONS);
  const [brands, setBrands] = useState<string[]>(BRAND_OPTIONS[CATEGORY_OPTIONS[0]]);
  const companionOptions = ["Alone", "With friends", "With family", "With colleagues", "With partner"];
  const [liveTranscript, setLiveTranscript] = useState("");
  const speechRef = useRef<ReturnType<typeof createSpeechRecognizer>>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const availableBrands = BRAND_OPTIONS[formData.category] || [];
    setBrands(availableBrands);
    if (!availableBrands.includes(formData.brand)) {
      setFormData((prev) => ({ ...prev, brand: "" }));
    }
  }, [formData.category]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const renderMealFields = () => (
    <>
      <div>
        <Label htmlFor="photo">Photo</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="glass-effect"
        />
      </div>
      {/* Product name removed as it's no longer captured manually */}
      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger id="category" className="glass-effect">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="brand">Brand</Label>
        <Select
          value={formData.brand}
          onValueChange={(value) => setFormData({ ...formData, brand: value })}
        >
          <SelectTrigger id="brand" className="glass-effect">
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="spend">Amount Spent</Label>
        <Input
          id="spend"
          value={formData.spend}
          onChange={(e) => setFormData({ ...formData, spend: e.target.value })}
          className="glass-effect"
        />
      </div>
      <div>
        <Label htmlFor="companions">Companion(s)</Label>
        <Select
          value={formData.companions}
          onValueChange={(value) => setFormData({ ...formData, companions: value })}
        >
          <SelectTrigger id="companions" className="glass-effect">
            <SelectValue placeholder="Who were you with?" />
          </SelectTrigger>
          <SelectContent>
            {companionOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="glass-effect"
        />
      </div>
    </>
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Reset shared state whenever capture method changes to avoid leftover media or data
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiAnalysis(null);
    setLiveTranscript('');
    setFormData(initialFormState);
  }, [captureMethod]);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.warn('Could not get location:', error);
      // Continue without location
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: 'Recording failed',
        description: 'Media devices are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    // Browsers only allow camera/mic access from secure contexts (HTTPS or localhost).
    // Some development setups use other loopback or private addresses, so we
    // explicitly allow typical local network hostnames.
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
    const isSecure = window.isSecureContext || isLocalhost;
    if (!isSecure) {
      toast({
        title: 'Secure context required',
        description: 'Camera and microphone access requires HTTPS or a local host.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const constraints: MediaStreamConstraints =
        recordingType === 'video'
          ? { audio: true, video: { facingMode: 'environment' } }
          : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (recordingType === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setLiveTranscript('');
      if (captureMethod === 'ai') {
        speechRef.current = createSpeechRecognizer((t) => setLiveTranscript(t));
        if (speechRef.current) {
          try {
            await speechRef.current.start();
          } catch (err) {
            console.error('Speech recognition error', err);
            speechRef.current = null;
            toast({
              title: 'Speech recognition unavailable',
              description:
                'Azure speech service could not be started. Recording will continue without live transcription.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Speech recognition unavailable',
            description:
              'Azure speech credentials are missing or invalid. Recording will continue without live transcription.',
            variant: 'destructive',
          });
        }
      }

      const options = {
        mimeType: recordingType === 'video' ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus'
      };
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        if (speechRef.current) {
          await speechRef.current.stop();
        }
        const currentUser = await authUtils.getCurrentUser();
        const userId = currentUser?.id;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const isVideo = recordingType === "video";
        const mimeType = isVideo ? "video/webm" : "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });

        // Stop all tracks from the stream as early as possible
        stream.getTracks().forEach((track) => track.stop());

        let fileToAnalyze: File;

        if (isVideo) {
          const videoFile = new File(
            [blob],
            `${userId || "anonymous"}_${timestamp}.webm`,
            { type: mimeType }
          );
          setSelectedFile(videoFile); // This is for upload

          try {
            toast({ title: "Extracting audio from video..." });
            const audioBlob = await extractAudioFromVideo(blob);
            fileToAnalyze = new File(
              [audioBlob],
              `${userId || "anonymous"}_${timestamp}.mp3`,
              { type: "audio/mpeg" }
            );
          } catch (error) {
            console.error("Failed to extract audio from video:", error);
            toast({
              title: "Audio Extraction Failed",
              description: "Could not process the audio from the video. Please try again.",
              variant: "destructive",
            });
            setIsRecording(false);
            return;
          }
        } else {
          // For audio-only recordings
          try {
            const mp3Blob = await Mp3AudioHelper.convertToMp3(blob);
            const audioFile = new File(
              [mp3Blob],
              `${userId || "anonymous"}_${timestamp}.mp3`,
              { type: "audio/mpeg" }
            );
            setSelectedFile(audioFile); // This is for upload
            fileToAnalyze = audioFile;
          } catch (error) {
            console.error("Failed to convert audio to MP3:", error);
            toast({
              title: "Audio Processing Failed",
              description: "Could not process the recorded audio. Please try again.",
              variant: "destructive",
            });
            setIsRecording(false);
            return;
          }
        }

        // Analyze with Azure AI using the (extracted) audio file
        await analyzeWithAzureAI(fileToAnalyze);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: `Recording ${recordingType}... Talk about your Nigerian meal experience!`,
      });
    } catch (error: any) {
      console.error('Recording start error', error);
      let description = 'Unable to access microphone or camera. Please grant permission.';
      if (error?.name === 'NotAllowedError') {
        description = 'Permission denied. Please allow access to microphone or camera.';
      } else if (error?.name === 'NotFoundError') {
        description = 'Required media device not found.';
      }
      toast({
        title: 'Recording failed',
        description,
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const analyzeWithAzureAI = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    try {
      let transcription = liveTranscript;

      if (!transcription.trim() && (file.type.includes('audio') || file.type.includes('video'))) {
        transcription = await transcribeAudio(file);
      }
      // Ensure the final transcription is displayed after recording completes
      setLiveTranscript(transcription);
      setAnalysisProgress(50);
      if (!transcription.trim()) {
        toast({
          title: "Transcription failed",
          description: "No speech detected in the recording.",
          variant: "destructive",
        });
        return;
      }

      // Analyze consumption data
      const analysis = await azureAI.analyzeConsumption(
        transcription,
        file.type.includes('video') ? 'video' : 'audio',
        (p) => {
          setAnalysisProgress(50 + p / 2);
        }
      );
      
      setAiAnalysis(analysis);

      // Auto-fill form with AI analysis (no manual corrections)
      setFormData({
        ...initialFormState,
        product: analysis.nigerianFoods?.[0] || 'Unknown food',
        brand: 'Unknown',
        category: 'Other',
        companions: 'Unknown',
        spend: analysis.amountSpent
          ? `${analysis.amountSpent.currency === 'NGN' ? '₦' : analysis.amountSpent.currency} ${analysis.amountSpent.amount}`
          : '',
        notes: transcription
      });

      toast({
        title: "AI Analysis Complete! 🍲",
        description: `Analyzed your Naija meal with ${Math.round((analysis.confidence || 0) * 100)}% confidence`,
      });
    } catch (error) {
      console.error('AI Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze the media.",
        variant: "destructive",
      });
    } finally {
      setAnalysisProgress(100);
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUser = await authUtils.getCurrentUser();
      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Validate required fields per capture method
      if (captureMethod === 'manual') {
        const { brand, category, spend, companions } = formData;
        if (!brand || !category || !spend || !companions) {
          toast({
            title: "Missing information",
            description: "Please complete all fields before submitting.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      } else if (!formData.product) {
        toast({
          title: "Missing snack name",
          description: "AI couldn't detect a snack. Please record again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let mediaUrl = '';

      // Compress and upload if a file was selected
      if (selectedFile) {
        let fileToUpload = selectedFile;

        if (selectedFile.type.startsWith('image/')) {
          if (MediaCompressor.needsCompression(selectedFile, 2)) {
            fileToUpload = await MediaCompressor.compressImage(selectedFile, 0.7, 800);
          }
        } else if (selectedFile.type.startsWith('video/')) {
          if (MediaCompressor.needsCompression(selectedFile, 10)) {
            fileToUpload = await MediaCompressor.compressVideo(selectedFile);
          }
        }

        // Prefer direct Azure upload if configured
        const storage = getAzureStorage();
        if (storage) {
          const upload = await storage.uploadFile(fileToUpload);
          if (upload.success) {
            mediaUrl = upload.url;
          }
        } else {
          const localStorageService = getLocalStorage();
          const uploadResult = await localStorageService.uploadFile(fileToUpload);
          if (uploadResult.success) {
            mediaUrl = uploadResult.url;
          }
        }
      }

      // Calculate points based on submission
      let points = captureMethod === 'ai' ? 15 : 10; // Base points
      if (captureMethod === 'ai' && selectedFile) {
        points += recordingType === 'video' ? 25 : 20; // Video bonus
      }
      if (formData.notes.length > 50) points += 10; // Detailed description bonus

      // Create consumption log
      const logData = {
        product: captureMethod === 'ai' ? formData.product : formData.brand,
        brand: formData.brand,
        category: formData.category,
        spend: formData.spend ? parseFloat(formData.spend.replace('₦', '')) : undefined,
        companions: formData.companions,
        location: currentLocation ? LocationService.formatLocation(currentLocation) : formData.location,
        notes: formData.notes,
        mediaUrl,
        mediaType: selectedFile
          ? selectedFile.type.startsWith('video/')
            ? 'video'
            : selectedFile.type.startsWith('audio/')
              ? 'audio'
              : 'photo'
          : undefined,
        captureMethod,
        aiAnalysis: captureMethod === 'ai' ? aiAnalysis : undefined,
        points
      };

      await dbOperations.createConsumptionLog(logData);
      await dbOperations.updateUserPoints(currentUser.id, points);

      toast({
        title: "Naija meal logged successfully! 🎉",
        description: `You earned ${points} points for this entry.`,
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: "Unable to save your consumption log.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-secondary pb-20 lg:pb-0">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Share your snacking experience</h1>
            <p className="text-muted-foreground">Record your Snacks experience and earn points!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-4">
              <Button
                type="button"
                variant={captureMethod === 'manual' ? 'default' : 'outline'}
                onClick={() => setCaptureMethod('manual')}
                className={captureMethod === 'manual' ? 'gradient-primary text-white' : ''}
              >
                Manual Entry
              </Button>
              <Button
                type="button"
                variant={captureMethod === 'ai' ? 'default' : 'outline'}
                onClick={() => setCaptureMethod('ai')}
                className={captureMethod === 'ai' ? 'gradient-primary text-white' : ''}
              >
                AI Capture
              </Button>
            </div>

            {/* AI Media Capture Section */}
            {captureMethod === 'ai' && (
            <Card className="glass-card hover-glow">
              <CardHeader>
                <CardTitle className="flex items-center text-gradient">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI-Powered Media Capture
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4 mb-6">
                      <Button
                        type="button"
                        variant={recordingType === 'audio' ? 'default' : 'outline'}
                        onClick={() => setRecordingType('audio')}
                        className={recordingType === 'audio' ? 'gradient-primary text-white' : ''}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Audio Only
                      </Button>
                      <Button
                        type="button"
                        variant={recordingType === 'video' ? 'default' : 'outline'}
                        onClick={() => setRecordingType('video')}
                        className={recordingType === 'video' ? 'gradient-primary text-white' : ''}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Audio + Video
                      </Button>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center glass-effect">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 animated-gradient rounded-lg flex items-center justify-center">
                          {recordingType === 'video' ? (
                            <Video className="h-8 w-8 text-white" />
                          ) : (
                            <Mic className="h-8 w-8 text-white" />
                          )}
                        </div>
                      </div>
                      {isRecording && recordingType === 'video' && (
                        <video
                          ref={videoRef}
                          className="w-full max-h-64 mx-auto mb-4 rounded-lg"
                          muted
                          playsInline
                        />
                      )}
                      <p className="text-muted-foreground mb-6">
                        Record yourself talking about your Snacks experience.
                        Mention what you're eating, where you are, who you're with, and how it tastes!
                      </p>
                      {!isRecording ? (
                        <Button
                          type="button"
                          onClick={startRecording}
                          className="animated-gradient hover-glow text-white"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Start {recordingType === 'video' ? 'Video' : 'Audio'} Recording
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={stopRecording}
                          variant="destructive"
                          className="hover-glow"
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg glass-effect">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          {recordingType === 'video' ? (
                            <Video className="h-5 w-5 text-white" />
                          ) : (
                            <Mic className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-sm text-green-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFile(null);
                          setAiAnalysis(null);
                          setLiveTranscript('');
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        Remove
                      </Button>
                    </div>

                    {previewUrl && (
                      <div className="mt-4">
                        {recordingType === 'video' ? (
                          <video src={previewUrl} controls className="w-full rounded-lg" />
                        ) : (
                          <audio src={previewUrl} controls className="w-full" />
                        )}
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="text-center py-6 space-y-2">
                        <div className="inline-flex items-center space-x-2 text-primary">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span>AI is analyzing your snack experience...</span>
                        </div>
                        <Progress value={analysisProgress} className="h-2 w-full" />
                        <p className="text-sm text-muted-foreground">{Math.round(analysisProgress)}%</p>
                      </div>
                    )}

                    {aiAnalysis && (
                      <div className="glass-effect rounded-lg p-4">
                        <h4 className="font-semibold text-primary mb-3">AI Analysis Results</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-primary font-medium">Nigerian Foods:</span>
                            <span className="ml-2 text-foreground">{aiAnalysis.nigerianFoods?.join(', ') || ''}</span>
                          </div>
                          <div>
                            <span className="text-primary font-medium">Confidence:</span>
                            <span className="ml-2 text-foreground">{aiAnalysis.confidence != null ? `${Math.round(aiAnalysis.confidence * 100)}%` : ''}</span>
                          </div>
                          <div>
                            <span className="text-primary font-medium">Mood:</span>
                            <span className="ml-2 text-foreground">{aiAnalysis.mood || ''}</span>
                          </div>
                          <div>
                            <span className="text-primary font-medium">Amount Spent:</span>
                            <span className="ml-2 text-foreground">
                              {aiAnalysis.amountSpent
                                ? `${aiAnalysis.amountSpent.currency === 'NGN' ? '₦' : aiAnalysis.amountSpent.currency} ${aiAnalysis.amountSpent.amount}`
                                : ''}
                            </span>
                          </div>
                        </div>
                        {aiAnalysis.said && (
                          <div className="mt-3">
                            <span className="text-primary font-medium text-sm">What you said:</span>
                            <p className="text-foreground text-sm mt-1">{aiAnalysis.said}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full gradient-primary hover-glow text-white shadow-lg"
                      disabled={isSubmitting || isAnalyzing}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading & Saving...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit my experience👍
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Manual Entry Section */}
            {captureMethod === 'manual' && (
            <Card className="glass-card hover-glow">
              <CardHeader>
                <CardTitle className="flex items-center text-gradient">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Meal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderMealFields()}
                <Button
                  type="submit"
                  className="w-full gradient-primary hover-glow text-white shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit my experience👍
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogConsumption;
