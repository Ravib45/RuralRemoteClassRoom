import React, { useEffect, useState } from 'react';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Assume Tailwind CSS is available
// Load Lucide React icons via a CDN for this single file component
// For a production app, you would use a bundler to import these
// Since we're in a single file, we'll use inline SVGs for simplicity and to avoid external scripts
const IconShield = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L20 6v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" /></svg>
);
const IconUsers = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconDownload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const IconCheckSquare = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);
const IconMessageSquare = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const IconHelpCircle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.86 0"/><path d="M12 12v4"/><path d="M12 21a9 9 0 0 0 9-9h-9a9 9 0 0 0-9 9"/></svg>
);


export default function App() {
    // Firebase globals
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // App State
    const [role, setRole] = useState("student");
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [liveChat, setLiveChat] = useState([]);
    const [livePoll, setLivePoll] = useState(null);
    const [studentProgress, setStudentProgress] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '' });

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestore);
            setAuth(firebaseAuth);

            onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsAuthReady(true);
                    console.log("Authenticated as:", user.uid);
                } else {
                    console.log("No user signed in. Signing in anonymously.");
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                    } catch (error) {
                        console.error("Firebase Auth Error:", error);
                    }
                }
            });
        } catch (error) {
            console.error("Firebase Initialization Error:", error);
        }
    }, [firebaseConfig, initialAuthToken]);

    // Firestore Listeners
    useEffect(() => {
        if (!isAuthReady || !db) return;

        // Lessons Listener
        const lessonsRef = collection(db, `artifacts/${appId}/public/data/lessons`);
        const unsubscribeLessons = onSnapshot(lessonsRef, (snapshot) => {
            const fetchedLessons = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLessons(fetchedLessons);
        }, (error) => console.error("Error fetching lessons:", error));

        // Quiz Answers Listener (Private to user)
        const quizAnswersRef = collection(db, `artifacts/${appId}/users/${userId}/quizAnswers`);
        const unsubscribeAnswers = onSnapshot(quizAnswersRef, (snapshot) => {
            const answers = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.answers) {
                    answers[doc.id] = data.answers;
                }
            });
            setQuizAnswers(answers);
        }, (error) => console.error("Error fetching answers:", error));

        // Live Chat Listener (Public)
        const chatRef = collection(db, `artifacts/${appId}/public/data/liveChat`);
        const unsubscribeChat = onSnapshot(chatRef, (snapshot) => {
            const chatMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.timestamp - b.timestamp);
            setLiveChat(chatMessages);
        }, (error) => console.error("Error fetching chat:", error));

        // Live Poll Listener (Public)
        const pollRef = doc(db, `artifacts/${appId}/public/data/livePoll`);
        const unsubscribePoll = onSnapshot(pollRef, (snapshot) => {
            if (snapshot.exists()) {
                setLivePoll(snapshot.data());
            } else {
                setLivePoll(null);
            }
        }, (error) => console.error("Error fetching poll:", error));
        
        // Student Progress Listener (Teacher View)
        if (role === 'teacher') {
            const allQuizAnswersRef = collection(db, `artifacts/${appId}/users`);
            const unsubscribeStudentProgress = onSnapshot(allQuizAnswersRef, async (snapshot) => {
                const progressData = [];
                for (const userDoc of snapshot.docs) {
                    const userAnswersRef = collection(db, userDoc.ref.path + '/quizAnswers');
                    const userAnswersSnapshot = await getDocs(userAnswersRef);
                    const quizzesCompleted = userAnswersSnapshot.size;
                    
                    progressData.push({
                        id: userDoc.id,
                        name: `Student-${userDoc.id.slice(0, 4)}`,
                        quizCompleted: quizzesCompleted,
                        lastSync: 'Online', // Placeholder for now
                    });
                }
                setStudentProgress(progressData);
            }, (error) => console.error("Error fetching student progress:", error));

            return () => {
                unsubscribeLessons();
                unsubscribeAnswers();
                unsubscribeChat();
                unsubscribePoll();
                unsubscribeStudentProgress();
            };
        }

        return () => {
            unsubscribeLessons();
            unsubscribeAnswers();
            unsubscribeChat();
            unsubscribePoll();
        };

    }, [isAuthReady, db, userId, appId, role]);

    function showCustomModal(title, message) {
        setModalContent({ title, message });
        setShowModal(true);
    }

    const Modal = ({ title, message, onClose }) => {
        if (!showModal) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
                <div className="bg-slate-800 rounded-lg p-6 shadow-2xl max-w-sm w-full border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                    <p className="text-white/80 mb-4">{message}</p>
                    <button onClick={onClose} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md">
                        Close
                    </button>
                </div>
            </div>
        );
    };

    function tinySlides(title) {
        return [
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23333'>${title} — Slide 1</text></svg>`,
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23333'>${title} — Slide 2</text></svg>`,
        ];
    }

    function handleRoleToggle() {
        setRole((r) => (r === "student" ? "teacher" : "student"));
        setSelectedLesson(null);
    }

    const TeacherPanel = () => {
        const [title, setTitle] = useState("");
        const [chatMessage, setChatMessage] = useState("");
        const [pollQuestion, setPollQuestion] = useState("");

        const teacherCreateLesson = async () => {
            if (!db || !title.trim()) return;
            const lessonsRef = collection(db, `artifacts/${appId}/public/data/lessons`);
            const newLesson = {
                title: title.trim(),
                duration: "00:00",
                slides: tinySlides(title.trim()),
                audioBlob: null,
                sizeKB: 40,
                isDownloaded: false,
                isCompleted: false,
            };
            await addDoc(lessonsRef, newLesson);
            setTitle("");
        };

        const teacherStartRecording = async (lessonId) => {
            if (!db) return;
            setIsRecording(true);
            const lessonRef = doc(db, `artifacts/${appId}/public/data/lessons`, lessonId);
            setTimeout(async () => {
                await setDoc(lessonRef, { audioBlob: { url: null, sizeKB: 16 }, duration: "16:20" }, { merge: true });
                setIsRecording(false);
            }, 1500);
        };

        const sendChatMessage = async () => {
            if (!db || !chatMessage.trim()) return;
            const chatRef = collection(db, `artifacts/${appId}/public/data/liveChat`);
            await addDoc(chatRef, { user: "Teacher", message: chatMessage, timestamp: Date.now() });
            setChatMessage("");
        };

        const startPoll = async () => {
            if (!db || !pollQuestion.trim()) return;
            const pollRef = doc(db, `artifacts/${appId}/public/data/livePoll`);
            await setDoc(pollRef, {
                question: pollQuestion,
                options: ['A', 'B', 'C'],
                responses: {},
            });
            setPollQuestion("");
        };

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/6 rounded-xl p-4 border border-white/10">
                        <div className="text-white font-semibold mb-2">Create a new Lesson</div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title..." className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white outline-none border border-white/10" />
                            <button onClick={teacherCreateLesson} className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium transition-colors">Create</button>
                        </div>
                    </div>
                    <div className="bg-white/6 rounded-xl p-4 border border-white/10">
                        <div className="text-white font-semibold mb-2">Recording (simulated)</div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <select className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white border border-white/10" onChange={(e) => setSelectedLesson(lessons.find(l => l.id === e.target.value))} value={selectedLesson?.id || ""}>
                                <option value="">Select lesson to record</option>
                                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                            </select>
                            <button disabled={!selectedLesson || isRecording} onClick={() => teacherStartRecording(selectedLesson.id)} className="px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium transition-colors">{isRecording ? 'Recording...' : 'Start Recording'}</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white/6 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-semibold mb-4">Live Class & Polling</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <h4 className="text-white/80 font-medium mb-2">Live Chat</h4>
                            <div className="h-48 overflow-y-auto bg-white/5 rounded-lg p-4 space-y-3 mb-3 border border-white/10">
                                {liveChat.length === 0 && <div className="text-white/50 italic text-sm">Chat is empty...</div>}
                                {liveChat.map((msg, i) => (
                                    <div key={msg.id} className="flex items-start gap-2 text-sm">
                                        <span className="font-semibold text-sky-400">{msg.user}:</span>
                                        <p className="text-white/80">{msg.message}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-full bg-white/10 text-white outline-none" />
                                <button onClick={sendChatMessage} className="px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 font-medium hover:bg-indigo-500/30">Send</button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-white/80 font-medium mb-2">Create Poll</h4>
                            <div className="space-y-2">
                                <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question..." className="w-full px-3 py-2 rounded-lg bg-white/10 text-white outline-none" />
                                <button onClick={startPoll} className="w-full px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30">Start Poll</button>
                                {livePoll && (
                                    <div className="bg-white/5 p-4 rounded-lg mt-4 border border-white/10">
                                        <div className="text-white font-medium mb-2">Active Poll: {livePoll.question}</div>
                                        <div className="text-sm text-white/70">
                                            {livePoll.options.map(option => (
                                                <div key={option}>{option}: {livePoll.responses?.[option] || 0} responses</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/6 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white text-lg font-semibold mb-4">Student Progress</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {studentProgress.map(student => (
                            <div key={student.id} className="bg-white/5 p-4 rounded-lg flex flex-col gap-2 border border-white/10">
                                <div className="text-sm font-semibold text-white/90">{student.name}</div>
                                <div className="text-xs text-white/70">Quizzes Completed: <span className="font-medium text-white">{student.quizCompleted}</span></div>
                                <div className="text-xs text-white/70">Last Sync: <span className="font-medium text-white">{student.lastSync}</span></div>
                                <div className="text-xs text-white/70">User ID: <span className="font-mono text-white/50 break-all">{student.id}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const StudentPanel = () => {
        const [chatMessage, setChatMessage] = useState("");
        const [showQuiz, setShowQuiz] = useState(true);

        const sendChatMessage = async () => {
            if (!db || !chatMessage.trim()) return;
            const chatRef = collection(db, `artifacts/${appId}/public/data/liveChat`);
            await addDoc(chatRef, { user: "Student", message: chatMessage, timestamp: Date.now() });
            setChatMessage("");
        };

        const submitPollAnswer = async (option) => {
            if (!db || !livePoll || !userId) return;
            const pollRef = doc(db, `artifacts/${appId}/public/data/livePoll`);
            const currentResponses = livePoll.responses || {};
            const userResponseKey = `response_${userId}`;
            
            // Check if user has already voted
            if (currentResponses[userResponseKey]) {
                showCustomModal("Already Voted", "You have already submitted an answer for this poll.");
                return;
            }
            
            const newResponses = {
                ...currentResponses,
                [option]: (currentResponses[option] || 0) + 1,
                [userResponseKey]: option
            };
            await setDoc(pollRef, { responses: newResponses }, { merge: true });
            showCustomModal("Poll Answer Submitted", `Your vote for option ${option} has been recorded.`);
        };
        

        return (
            <div className="space-y-6">
                <div className="bg-slate-800/60 rounded-xl p-6 shadow-xl border border-white/10">
                    <div className="text-white text-lg font-semibold mb-2">My Progress 📊</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg flex items-center gap-4 border border-white/10">
                            <div className="rounded-full bg-sky-500/20 p-3">
                                <IconCheckSquare className="w-6 h-6 text-sky-400" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-white">Quizzes Completed</div>
                                <div className="text-sm text-white/70">{Object.keys(quizAnswers).length} lessons</div>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg flex items-center gap-4 border border-white/10">
                            <div className="rounded-full bg-emerald-500/20 p-3">
                                <IconDownload className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-lg font-bold text-white">Lessons Downloaded</div>
                                <div className="text-sm text-white/70">{lessons.filter(l => l.isDownloaded).length} lessons</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-800/60 rounded-xl p-6 shadow-xl border border-white/10">
                    <div className="text-white text-lg font-semibold mb-4">Live Class 💬</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <div className="h-64 overflow-y-auto bg-white/5 rounded-lg p-4 space-y-3 mb-3 border border-white/10">
                                {liveChat.length === 0 && <div className="text-white/50 italic text-sm">No messages yet. Join the class!</div>}
                                {liveChat.map((msg, i) => (
                                    <div key={msg.id} className={`flex items-start gap-2 text-sm ${msg.user === 'Teacher' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`p-2 rounded-lg max-w-[80%] ${msg.user === 'Teacher' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-sky-500/20 text-sky-200'}`}>
                                            <span className="font-semibold">{msg.user}:</span> {msg.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-full bg-white/10 text-white outline-none" />
                                <button onClick={sendChatMessage} className="px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors">Send</button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col">
                            <h4 className="text-white/80 font-medium mb-2">Active Poll</h4>
                            {livePoll ? (
                                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                    <div className="text-white font-medium mb-2">{livePoll.question}</div>
                                    <div className="space-y-2">
                                        {livePoll.options.map(option => (
                                            <button key={option} onClick={() => submitPollAnswer(option)} className="w-full px-4 py-2 rounded-lg text-sm bg-indigo-500/20 text-indigo-300 font-medium hover:bg-indigo-500/30 transition-colors">
                                                Vote for {option}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-4 text-xs text-white/70 italic">Your vote will be synced to the teacher.</div>
                                </div>
                            ) : (
                                <div className="bg-white/5 p-4 rounded-lg border border-white/10 text-white/50 italic text-sm">
                                    No active polls.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-6 shadow-xl border border-white/10">
                    <div className="text-white text-lg font-semibold mb-4">My Lessons</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lessons.map(lesson => (
                            <LessonCard key={lesson.id} lesson={lesson} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const LessonCard = ({ lesson }) => (
        <div className="bg-slate-800/60 rounded-2xl p-6 flex flex-col gap-4 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div>
                    <div className="text-white text-lg font-semibold">{lesson.title}</div>
                    <div className="text-sm text-white/60 mt-1">
                        Size: <span className="text-white font-medium">{lesson.sizeKB} KB</span> • Duration: <span className="text-white font-medium">{lesson.duration}</span>
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2 mt-2 sm:mt-0">
                    <button onClick={() => setSelectedLesson(lesson)} className="w-full sm:w-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">Open</button>
                    <button onClick={() => downloadLessonPacket(lesson)} className="w-full sm:w-auto px-4 py-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-sm font-medium text-emerald-300 transition-colors">Download</button>
                </div>
            </div>
            <div className="flex gap-3 overflow-hidden">
                {lesson.slides && lesson.slides.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex-1 w-28 h-16 rounded-lg overflow-hidden border border-white/10 shadow-md">
                        <img alt={`slide-${i}`} src={`data:image/svg+xml;utf8,${encodeURIComponent(s)}`} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>
    );

    const downloadLessonPacket = (lesson) => {
        const payload = {
            id: lesson.id,
            title: lesson.title,
            slides: lesson.slides,
            audio: lesson.audioBlob ? "<<tiny-audio-placeholder>>" : null,
        };
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lesson.title.replace(/\s+/g, "_")}_packet.json`;
        a.click();
        URL.revokeObjectURL(url);
        // This is a demo. In a real app, you'd update Firestore with the download status.
        showCustomModal("Download Complete", `${lesson.title} has been downloaded. It's now ready for offline viewing.`);
    };

    const handleAnswer = async (lessonId, qId, answer) => {
        if (!db || !userId) return;
        const answersRef = doc(db, `artifacts/${appId}/users/${userId}/quizAnswers/${lessonId}`);
        const currentAnswers = quizAnswers[lessonId] || {};
        const newAnswers = { ...currentAnswers, [qId]: answer };
        await setDoc(answersRef, { answers: newAnswers }, { merge: true });
        // The onSnapshot listener will update the local state.
    };

    const QuizQuestion = ({ lessonId, qId, question, onAnswer }) => {
        const value = (quizAnswers[lessonId] || {})[qId] || '';
        return (
            <div>
                <div className="text-sm text-white/90">{question}</div>
                <input value={value} onChange={(e) => onAnswer(e.target.value)} className="mt-1 w-full px-2 py-1 rounded-lg bg-white/5 text-white text-sm outline-none border border-white/10" />
            </div>
        );
    };

    const LessonDetail = () => {
        if (!selectedLesson) return (
            <div className="text-white/60 p-6 text-center italic flex flex-col items-center">
                <IconMessageSquare className="w-12 h-12 mb-4 text-white/30"/>
                <p>Select a lesson to view its details.</p>
                <p className="text-sm mt-2">You can download the lesson for offline study. 📥</p>
            </div>
        );

        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl transition-all duration-300 border border-white/10">
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                                <h2 className="text-2xl font-bold text-white tracking-wide">{selectedLesson.title}</h2>
                                <div className="text-sm text-sky-400 font-semibold bg-sky-400/10 rounded-full px-3 py-1">
                                    {selectedLesson.sizeKB} KB
                                </div>
                            </div>
                            <div className="text-sm text-white/60 mb-4">
                                Duration: {selectedLesson.duration} • <span className="text-emerald-400 font-medium">Offline-ready</span>
                            </div>
                            <div className="space-y-2 mb-6">
                                <h3 className="text-white font-medium text-lg">Lesson Slides</h3>
                                <div className="flex flex-wrap gap-4">
                                    {selectedLesson.slides.map((s, i) => (
                                        <div key={i} className="w-full sm:w-44 h-28 border border-white/10 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.05] hover:border-indigo-400">
                                            <img alt={`slide-${i}`} src={`data:image/svg+xml;utf8,${encodeURIComponent(s)}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-xl shadow-inner border border-white/10">
                                <h3 className="text-white font-semibold mb-2">Audio Playback 🔊</h3>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {selectedLesson.audioBlob ? (
                                        <div className="flex items-center gap-4">
                                            <button className="px-5 py-2 rounded-full bg-indigo-500/20 text-white font-medium hover:bg-indigo-500/30 transition-colors">
                                                Play
                                            </button>
                                            <div className="text-sm text-white/60">
                                                Audio size: <span className="font-semibold text-white">{selectedLesson.audioBlob.sizeKB} KB</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-white/50 italic">
                                            No audio recorded for this lesson yet.
                                        </div>
                                    )}
                                    <button onClick={() => downloadLessonPacket(selectedLesson)} className="px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors shadow-lg">
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-full lg:w-64 bg-slate-700/50 rounded-xl p-4 shadow-inner border border-white/10">
                            <h3 className="text-sm text-white font-semibold mb-2">Quick Stats 📊</h3>
                            <ul className="text-xs text-white/80 space-y-2">
                                <li>Last updated: <span className="text-white/50">real-time sync</span></li>
                                <li>Total views: <span className="text-white/50">n/a</span></li>
                                <li>Quiz completions: <span className="text-white/50">n/a</span></li>
                            </ul>
                            <div className="mt-4 text-xs text-white/70 italic">
                                Note: These stats are mock. A real system would have to tally these from a central database.
                            </div>
                        </div>
                    </div>
                </div>
                {role === 'student' && (
                    <div className="bg-slate-800/60 rounded-xl p-6 shadow-xl border border-white/10">
                        <div className="text-white text-lg font-semibold mb-2">Offline Quiz 📝</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <QuizQuestion
                                lessonId={selectedLesson.id}
                                qId={'q1'}
                                question={'What is the main idea of this lesson?'}
                                onAnswer={(ans) => handleAnswer(selectedLesson.id, 'q1', ans)}
                            />
                            <QuizQuestion
                                lessonId={selectedLesson.id}
                                qId={'q2'}
                                question={'Rate clarity (1-5)'}
                                onAnswer={(ans) => handleAnswer(selectedLesson.id, 'q2', ans)}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const Header = () => (
        <header className="w-full bg-slate-900/80 backdrop-blur-md text-white p-4 shadow-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/10 p-2">
                        <IconShield className="w-7 h-7" />
                    </div>
                    <div className="text-xl font-bold tracking-tight">Remote Schoolroom</div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5">
                        <IconUsers className="w-5 h-5 text-white/50"/>
                        <div className="text-sm font-light text-white/70 hidden sm:block">
                            User: <span className="font-mono text-white/50 break-all">{userId ? userId.slice(0, 8) + '...' : 'Connecting...'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleRoleToggle}
                        className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm font-semibold"
                    >
                        Switch to {role === "student" ? "Teacher" : "Student"}
                    </button>
                </div>
            </div>
        </header>
    );

    const Hero = () => (
        <section className="relative w-full overflow-hidden text-white py-16 md:py-24">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-950 to-indigo-950 z-0 opacity-80" />
            <div className="relative max-w-6xl mx-auto px-4 z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
                        Your Classroom, Anywhere
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-6">
                        Delivering high-quality, offline-ready lessons and audio to students in low-bandwidth rural areas. Learn, teach, and connect seamlessly.
                    </p>
                    <div className="flex justify-center md:justify-start gap-4">
                        <button
                            onClick={() => setRole("student")}
                            className={`px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${role === 'student' ? 'bg-sky-500 text-white shadow-xl' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                        >
                            I'm a Student
                        </button>
                        <button
                            onClick={() => setRole("teacher")}
                            className={`px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${role === 'teacher' ? 'bg-indigo-500 text-white shadow-xl' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                        >
                            I'm a Teacher
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
    
    const Sidebar = () => (
        <aside className="w-full md:w-72 bg-white/5 p-4 rounded-xl shadow-inner border border-white/10">
            <div className="mb-4 text-sm text-white/80">Quick actions</div>
            <div className="flex flex-col gap-3">
                <button onClick={() => showCustomModal("Offline-First Demo", "This feature simulates a full data sync. Your quiz answers would be pushed to the cloud, and new content would be downloaded.")} className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 font-medium">Sync answers</button>
                <button onClick={() => showCustomModal("Network Status", "This is a demo of network connectivity. The app is designed to work well even with throttled or intermittent connections.")} className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 font-medium">Network test</button>
            </div>
        </aside>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white font-sans">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                    body { font-family: 'Inter', sans-serif; }
                `}
            </style>
            <Modal
                title={modalContent.title}
                message={modalContent.message}
                onClose={() => setShowModal(false)}
            />
            <Header />
            <Hero />
            <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                <div className="hidden md:block">
                    <Sidebar />
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                        <div className="flex-1">
                            {role === 'teacher' ? <TeacherPanel /> : <StudentPanel />}
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white/6 rounded-xl p-4 border border-white/10">
                                <div className="text-white font-semibold mb-2">Lesson Detail</div>
                                <LessonDetail />
                            </div>
                            <div className="bg-white/6 rounded-xl p-4 border border-white/10">
                                <div className="text-white font-semibold mb-2">Connectivity Hint</div>
                                <div className="text-xs text-white/70">This UI prioritizes: audio-first lessons, tiny slide packets (SVG thumbnails), and offline quizzes. Data syncs when a connection is available, making it robust for limited data plans.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="mt-8 p-4 text-center text-xs text-white/60">Remote Schoolroom — prototype • Tailwind CSS UI • Designed for low-bandwidth rural campuses</footer>
        </div>
    );
}
