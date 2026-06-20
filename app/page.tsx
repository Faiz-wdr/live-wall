'use client';

import { useEffect, useState, useRef } from 'react';
import { useRealtimePosts, Post } from '@/hooks/useRealtimePosts';
import { useUserIdentity } from '@/hooks/useUserIdentity';
import { uploadImage } from '@/lib/uploadImage';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const CARD_THEMES = [
  { border: 'border-primary/45', text: 'text-primary', progress: 'from-primary to-accent', bg: 'bg-primary/5 shadow-primary/5' },
  { border: 'border-accent/45', text: 'text-accent', progress: 'from-accent to-purple-400', bg: 'bg-accent/5 shadow-accent/5' },
  { border: 'border-cyan-500/45', text: 'text-cyan-400', progress: 'from-cyan-500 to-cyan-300', bg: 'bg-cyan-500/5 shadow-cyan-500/5' },
  { border: 'border-emerald-500/45', text: 'text-emerald-400', progress: 'from-emerald-500 to-emerald-300', bg: 'bg-emerald-500/5 shadow-emerald-500/5' },
  { border: 'border-amber-500/45', text: 'text-amber-400', progress: 'from-amber-500 to-amber-300', bg: 'bg-amber-500/5 shadow-amber-500/5' },
  { border: 'border-rose-500/45', text: 'text-rose-400', progress: 'from-rose-500 to-rose-300', bg: 'bg-rose-500/5 shadow-rose-500/5' },
  { border: 'border-pink-500/45', text: 'text-pink-400', progress: 'from-pink-500 to-pink-300', bg: 'bg-pink-500/5 shadow-pink-500/5' },
  { border: 'border-indigo-500/45', text: 'text-indigo-400', progress: 'from-indigo-500 to-indigo-300', bg: 'bg-indigo-500/5 shadow-indigo-500/5' }
];

// Helper to replace Sierra Leone flag emoji "🇸🇱" with an inline image for Windows compatibility
const renderMessageWithFlags = (text: string | null) => {
  if (!text) return null;
  const slFlagPattern = /🇸🇱/g;
  const parts = text.split(slFlagPattern);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 && (
            <img
              src="https://flagcdn.com/w80/sl.png"
              alt="🇸🇱"
              className="inline-block h-3 w-4.5 object-cover mx-0.5 align-middle rounded-sm"
              style={{ contentVisibility: 'auto' }}
            />
          )}
        </span>
      ))}
    </>
  );
};

export default function Home() {
  const { posts, loading, error, createPost, likePost } = useRealtimePosts();
  const { displayName, isInitialized, saveIdentity } = useUserIdentity();

  // Settings
  const [expiryDuration, setExpiryDuration] = useState<number>(5); // default 5 minutes
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'username' | 'create'>('username');
  const [tempUsername, setTempUsername] = useState('');
  const [messageText, setMessageText] = useState('');
  const [postMode, setPostMode] = useState<'text' | 'photo'>('text');

  // Camera & Capture States
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  // Layout positions state (cached for each post to prevent overlap and reposition on resize)
  const [layoutSlots, setLayoutSlots] = useState<{ [postId: string]: { x: number; y: number; delay: number } }>({});
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const processedPostIdsRef = useRef<Set<string>>(new Set());

  const flagImageRef = useRef<HTMLImageElement | null>(null);

  // Pre-load Sierra Leone flag PNG to bypass Windows flag emoji support limitation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = 'https://flagcdn.com/w80/sl.png';
      img.onload = () => {
        flagImageRef.current = img;
      };
    }
  }, []);

  // Trigger Confetti helper
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
    for (let i = 0; i < 70; i++) {
      // Left launcher
      particlesRef.current.push({
        x: 0,
        y: height,
        vx: Math.random() * 8 + 4,
        vy: -(Math.random() * 12 + 10),
        size: Math.random() * 6 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        type: 'confetti',
      });
      // Right launcher
      particlesRef.current.push({
        x: width,
        y: height,
        vx: -(Math.random() * 8 + 4),
        vy: -(Math.random() * 12 + 10),
        size: Math.random() * 6 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        type: 'confetti',
      });
    }
    startAnimation();
  };

  // Trigger Emoji Shower helper
  const triggerEmojiShower = (emoji: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;

    for (let i = 0; i < 60; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: -30 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 12 + 20,
        emoji: emoji,
        rotation: (Math.random() - 0.5) * 30,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: 1,
        type: 'emoji',
      });
    }
    startAnimation();
  };

  const startAnimation = () => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(updateParticles);
    }
  };

  const updateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animationFrameRef.current = null;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameRef.current = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const particles = particlesRef.current;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'confetti') {
        p.vy += 0.25;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
      } else {
        p.vy += 0.05;
        p.vx += Math.sin(p.y / 30) * 0.05;
        p.rotation += p.rotationSpeed * 0.5;
      }

      if (p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.type === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.5);
      } else {
        if (flagImageRef.current) {
          const imgWidth = p.size * 1.5;
          const imgHeight = p.size;
          ctx.drawImage(flagImageRef.current, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        } else {
          ctx.font = `${p.size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji, 0, 0);
        }
      }
      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameRef.current = requestAnimationFrame(updateParticles);
    } else {
      animationFrameRef.current = null;
    }
  };

  // Resize canvas when window size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = windowSize.width;
      canvas.height = windowSize.height;
    }
  }, [windowSize]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initialLoadDoneRef = useRef(false);

  // Mark initial load as done to avoid triggering animations on existing posts during refresh
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        initialLoadDoneRef.current = true;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Monitor user posts for keyword triggers
  useEffect(() => {
    const userPosts = posts.filter((p) => p.post_type !== 'announcement');
    const activeIds = new Set(posts.map((p) => p.id));

    userPosts.forEach((post) => {
      if (!processedPostIdsRef.current.has(post.id)) {
        processedPostIdsRef.current.add(post.id);

        const message = (post.message || '').toLowerCase();
        const hasConfettiWord = /\b(congratulations|congratulation|congratz|congrats)\b/.test(message);
        const hasSierraLeoneWord = message.includes('ssf') || post.message?.includes('🇸🇱');

        if (initialLoadDoneRef.current) {
          if (hasConfettiWord) {
            setTimeout(() => {
              triggerConfetti();
            }, 300);
          }

          if (hasSierraLeoneWord) {
            setTimeout(() => {
              triggerEmojiShower('🇸🇱');
            }, 300);
          }
        }
      }
    });

    processedPostIdsRef.current.forEach((id) => {
      if (!activeIds.has(id)) {
        processedPostIdsRef.current.delete(id);
      }
    });
  }, [posts]);

  // Update current time for expiry countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch expiry setting from DB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value');
        if (data) {
          const expiry = data.find((s) => s.key === 'post_expiry_duration');
          if (expiry) {
            setExpiryDuration(parseInt(expiry.value || '5', 10));
          }
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    loadSettings();
  }, []);

  // Track window size
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Calculate layout slots using a collision-free randomized coordinator
  useEffect(() => {
    const cardWidth = 230;
    const cardHeight = 180; // Estimated height for coordinate spacing
    const margin = 20;

    const newSlots = { ...layoutSlots };
    const userPosts = posts.filter(p => p.post_type !== 'announcement');

    // Helper to check if a rect overlaps with any already placed rects
    const checkOverlap = (x: number, y: number, id: string) => {
      for (const key in newSlots) {
        if (key === id) continue;
        const other = newSlots[key];
        if (
          x < other.x + cardWidth + margin &&
          x + cardWidth + margin > other.x &&
          y < other.y + cardHeight + margin &&
          y + cardHeight + margin > other.y
        ) {
          return true;
        }
      }
      return false;
    };

    userPosts.forEach((post, index) => {
      // If already has a position within current screen limits, keep it
      if (newSlots[post.id] && newSlots[post.id].x < windowSize.width - cardWidth && newSlots[post.id].y < windowSize.height - cardHeight) {
        return;
      }

      // Try to find a random non-overlapping slot coordinates
      let x = 0;
      let y = 0;
      let found = false;
      let attempts = 0;

      while (!found && attempts < 100) {
        x = Math.floor(Math.random() * (windowSize.width - cardWidth - 40)) + 20;
        y = Math.floor(Math.random() * (windowSize.height - cardHeight - 160)) + 100;

        if (!checkOverlap(x, y, post.id)) {
          found = true;
        }
        attempts++;
      }

      // Fallback: Grid cell allocation
      if (!found) {
        const cols = Math.max(1, Math.floor(windowSize.width / (cardWidth + 25)));
        const col = index % cols;
        const row = Math.floor(index / cols);
        x = col * (cardWidth + 25) + 20;
        y = row * (cardHeight + 25) + 120;
      }

      newSlots[post.id] = {
        x: Math.max(10, Math.min(windowSize.width - cardWidth - 10, x)),
        y: Math.max(100, Math.min(windowSize.height - cardHeight - 80, y)),
        delay: (index * 0.03) % 0.8,
      };
    });

    // Cleanup stale entries
    const activeIds = new Set(userPosts.map(p => p.id));
    for (const key in newSlots) {
      if (!activeIds.has(key)) {
        delete newSlots[key];
      }
    }

    setLayoutSlots(newSlots);
  }, [posts, windowSize.width, windowSize.height]);

  // Open modal handler
  const handleOpenAddPost = () => {
    setIsModalOpen(true);
    if (displayName) {
      setModalStep('create');
    } else {
      setModalStep('username');
    }
  };

  // Username form submit
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUsername.trim()) {
      saveIdentity(tempUsername.trim());
      setModalStep('create');
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    setImagePreview(null);
    setCapturedBlob(null);

    try {
      const constraints = {
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setCameraError('Camera stream blocked. Tap fallback option to snap a picture.');
      fileFallbackRef.current?.click();
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture frame
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setImagePreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.85);
    }
  };

  // Fallback upload
  const handleFallbackCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCapturedBlob(file);
      setImagePreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  // Reset Modal Form
  const resetForm = () => {
    stopCamera();
    setMessageText('');
    setCapturedBlob(null);
    setImagePreview(null);
    setPostError(null);
    setSubmitting(false);
  };

  // Submit Post
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !capturedBlob) {
      setPostError('Post must contain at least a text message or captured photo.');
      return;
    }

    try {
      setSubmitting(true);
      setPostError(null);
      let imageUrl = '';

      if (postMode === 'photo' && capturedBlob) {
        const imageFile = new File([capturedBlob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const { url, error: uploadErr } = await uploadImage(imageFile);
        if (uploadErr) throw new Error(uploadErr);
        imageUrl = url || '';
      }

      const { error: insertErr } = await createPost({
        display_name: displayName,
        message: postMode === 'text' ? messageText : (messageText || undefined),
        image_url: postMode === 'photo' ? imageUrl : undefined,
        post_type: 'user',
        expires_at: new Date(Date.now() + expiryDuration * 60000).toISOString(),
      });

      if (insertErr) throw new Error(insertErr);

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setPostError(err.message || 'Failed to submit post');
    } finally {
      setSubmitting(false);
    }
  };

  // Announcements list
  const announcements = posts.filter((p) => p.post_type === 'announcement');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-dots select-none">
      {/* Viewport Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[130px] pointer-events-none" />

      {/* Main Full-screen Canvas */}
      <div className="w-full h-full relative p-6">
        {/* Floating Header */}
        <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-3 glass px-5 py-2.5 rounded-2xl">
            {/* <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="text-white font-black text-sm">LW</span>
            </div> */}
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
              Live Wall
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleOpenAddPost}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              + Create Post
            </button>
          </div>
        </div>

        {/* Pinned Announcements Panel (Top Centered) */}
        {announcements.length > 0 && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-full px-4 flex flex-col items-center gap-3 pointer-events-auto">
            {(() => {
              const ann = announcements[0];
              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-fit max-w-[280px] sm:max-w-md bg-primary/20 border-2 border-primary/40 p-3 rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.15)] flex flex-col gap-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                  <div className="flex justify-between items-center mb-1 gap-6">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">📢 Announcement</span>
                    <span className="text-[9px] text-primary/70 font-semibold">@admin</span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-relaxed break-words">
                    {renderMessageWithFlags(ann.message)}
                  </p>
                </motion.div>
              );
            })()}
          </div>
        )}

        {/* Loading / Error Overlays */}
        {loading && posts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted font-bold">Assembling Live Canvas...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-24 left-6 right-6 flex items-center gap-3 p-4 rounded-2xl bg-danger/15 border border-danger/25 text-xs text-danger font-bold z-30 shadow-[0_0_20px_rgba(239,68,68,0.1)] animate-in fade-in slide-in-from-top-3 duration-300 backdrop-blur-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error loading live feed: {error}</span>
          </div>
        )}

        {/* Floating Post Cards Grid */}
        <AnimatePresence>
          {(() => {
            const userPosts = posts.filter((p) => p.post_type !== 'announcement');
            const maxLikes = userPosts.reduce((max, p) => (p.likes_count > max ? p.likes_count : max), 0);
            const mostLikedPost = maxLikes > 0 ? userPosts.find((p) => p.likes_count === maxLikes) : null;
            const mostLikedPostId = mostLikedPost ? mostLikedPost.id : null;

            return userPosts.map((post) => {
              const coords = layoutSlots[post.id] || { x: 50, y: 150, delay: 0 };

              // Calculate expiration progress bar
              let progressPercent = 100;
              if (post.expires_at) {
                const created = new Date(post.created_at).getTime();
                const expires = new Date(post.expires_at).getTime();
                const totalDuration = expires - created;
                const elapsed = currentTime - created;
                progressPercent = Math.max(0, Math.min(100, 100 - (elapsed / totalDuration) * 100));
              }

              // Filter out visually if already expired
              if (progressPercent <= 0) return null;

              const isLoved = post.id === mostLikedPostId;

              const colorIndex = (parseInt(post.id.substring(0, 4), 16) || 0) % CARD_THEMES.length;
              const colorTheme = CARD_THEMES[colorIndex];

              return (
                <motion.div
                  key={post.id}
                  drag
                  dragMomentum={true}
                  dragConstraints={{
                    left: 10,
                    right: windowSize.width - 240,
                    top: 80,
                    bottom: windowSize.height - 220,
                  }}
                  whileDrag={{ scale: 1.04, zIndex: 100 }}
                  onDragEnd={(event, info) => {
                    const finalX = coords.x + info.offset.x;
                    const finalY = coords.y + info.offset.y;
                    setLayoutSlots((prev) => ({
                      ...prev,
                      [post.id]: {
                        ...prev[post.id],
                        x: Math.max(10, Math.min(windowSize.width - 240, finalX)),
                        y: Math.max(80, Math.min(windowSize.height - 220, finalY)),
                      },
                    }));
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 100 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: coords.x,
                    y: coords.y,
                  }}
                  exit={{ opacity: 0, scale: 0.8, y: -100 }}
                  transition={{
                    type: 'spring',
                    stiffness: 70,
                    damping: 15,
                    delay: coords.delay,
                  }}
                  style={{
                    position: 'absolute',
                    width: '230px',
                    zIndex: isLoved ? 10 : 5,
                  }}
                  className={`rounded-2xl border transition-all duration-300 pointer-events-auto group cursor-grab active:cursor-grabbing overflow-hidden ${colorTheme.border} ${isLoved
                    ? 'bg-gradient-to-br from-accent/20 to-primary/20 border-accent shadow-[0_0_25px_rgba(168,85,247,0.25)] scale-105'
                    : `bg-surface/60 ${colorTheme.bg}`
                    }`}
                >
                  <div className="animate-pulse-slow p-3 flex flex-col gap-2 relative overflow-hidden">
                    {/* Loved Badge */}
                    {isLoved && (
                      <div className="px-2 py-0.5 bg-gradient-to-r from-accent to-primary text-[8px] font-black tracking-widest text-white uppercase rounded self-start flex items-center gap-1">
                        🏆 Most Loved
                      </div>
                    )}

                    {/* Image Attachment */}
                    {post.image_url && (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/25 border border-white/5">
                        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Post Message */}
                    {post.message && (
                      <p className="text-xs font-normal text-text/90 leading-normal break-words">
                        {renderMessageWithFlags(post.message)}
                      </p>
                    )}

                    {/* Footer Info (border separator line removed, spacing reduced) */}
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-[10px] font-bold ${colorTheme.text}`}>
                        {renderMessageWithFlags(post.display_name)}
                      </span>

                      {/* Heart Like Trigger */}
                      <button
                        onClick={() => likePost(post.id)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-muted hover:text-danger hover:bg-danger/10 hover:border-danger/15 transition-all font-semibold cursor-pointer"
                      >
                        ❤️ {post.likes_count}
                      </button>
                    </div>
                  </div>

                  {/* Elegant Expiring Progress Bar (Sleek thin line at absolute bottom of card container) */}
                  {post.expires_at && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colorTheme.progress} transition-all duration-1000`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            });
          })()}
        </AnimatePresence>
      </div>

      {/* MULTI-STEP CREATION DIALOG (MODAL OVERLAY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div
            onClick={() => {
              if (!submitting) {
                setIsModalOpen(false);
                resetForm();
              }
            }}
            className="absolute inset-0 cursor-default"
          />

          <div className="glass w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10">
            {/* Close Button */}
            {!submitting && (
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-surface hover:bg-surface-hover text-muted hover:text-white transition-all cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <AnimatePresence mode="wait">
              {modalStep === 'username' ? (
                /* STEP 1: USERNAME REGISTRATION */
                <motion.div
                  key="step-username"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl font-black text-white">Join the Wall</h2>
                    <p className="text-xs text-muted mt-1">Set your display name handle to contribute.</p>
                  </div>
                  <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Your Name</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-semibold">@</span>
                        <input
                          type="text"
                          required
                          placeholder="username"
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          className="w-full pl-9 pr-4 py-3 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!tempUsername.trim()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                    >
                      Continue
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* STEP 2: COMPOSE POST */
                <motion.div
                  key="step-create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-5"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h2 className="text-lg font-bold text-white">New Post</h2>
                    <span className="text-xs text-accent font-bold">
                      {renderMessageWithFlags(displayName || '')}
                    </span>
                  </div>

                  {/* Text OR Image selector toggle */}
                  <div className="grid grid-cols-2 p-1 bg-surface/40 border border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPostMode('text')}
                      className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${postMode === 'text' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                        }`}
                    >
                      Text Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostMode('photo')}
                      className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${postMode === 'photo' ? 'bg-primary text-white' : 'text-muted hover:text-white'
                        }`}
                    >
                      Instant Photo
                    </button>
                  </div>

                  <form onSubmit={handlePostSubmit} className="flex flex-col gap-4">
                    {postMode === 'text' ? (
                      /* MESSAGE TEXTAREA */
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          placeholder="Compose text for the wall..."
                          rows={4}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          maxLength={280}
                          className="w-full p-4 bg-surface border border-white/5 focus:border-primary/50 rounded-xl text-white placeholder-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm resize-none"
                        />
                        <span className="text-[10px] text-muted self-end">{messageText.length} / 280</span>
                      </div>
                    ) : (
                      /* CAMERA CAPTURED WINDOW */
                      <div className="flex flex-col gap-3">
                        <input
                          type="file"
                          ref={fileFallbackRef}
                          accept="image/*"
                          capture="environment"
                          onChange={handleFallbackCapture}
                          className="hidden"
                        />

                        {!imagePreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-surface/50 flex flex-col items-center justify-center p-4">
                            {isCameraActive ? (
                              <>
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={capturePhoto}
                                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-2 border-primary shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                                />
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-center p-3">
                                <span className="text-xs text-muted max-w-xs leading-relaxed">
                                  Use device camera to snap an instant photo. Uploads from local files are disabled.
                                </span>
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="mt-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold cursor-pointer"
                                >
                                  Open Camera
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden border border-white/15 aspect-video bg-surface">
                            <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={startCamera}
                              className="absolute bottom-3 right-3 px-3 py-1 rounded bg-black/80 hover:bg-black text-white text-xs font-bold cursor-pointer"
                            >
                              Retake
                            </button>
                          </div>
                        )}

                        {/* Optional text message alongside captured image */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Photo Caption (Optional)</label>
                          <input
                            type="text"
                            placeholder="Add photo text..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            maxLength={80}
                            className="w-full px-3 py-2 bg-surface border border-white/5 rounded-lg text-white text-xs"
                          />
                        </div>

                        {cameraError && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-[10px] text-warning font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{cameraError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {postError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-semibold shadow-[0_0_10px_rgba(239,68,68,0.05)] animate-in fade-in slide-in-from-top-1 duration-200">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{postError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {submitting ? 'Submitting...' : 'Post to Live Wall'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
      {/* Visual Effects Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-screen h-screen"
      />
    </div>
  );
}
