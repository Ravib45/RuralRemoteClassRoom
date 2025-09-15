import React, { useEffect, useState } from "react";
import './App.css'
// App.jsx
// Single-file PWA-style prototype UI for a low-bandwidth remote classroom
// Tailwind CSS v4.1 classes assumed to be available in the project

export default function App() {
    const [role, setRole] = useState("student"); // 'student' or 'teacher'
    const [lessons, setLessons] = useState(sampleLessons());
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState(loadLocalAnswers());
    const [syncLog, setSyncLog] = useState([]);

    useEffect(() => {
        // persist lessons in localStorage so PWA demo keeps state across reloads
        localStorage.setItem("rsr_lessons_v1", JSON.stringify(lessons));
    }, [lessons]);

    function sampleLessons() {
        const saved = localStorage.getItem("rsr_lessons_v1");
        if (saved) return JSON.parse(saved);
        return [
            {
                id: "l1",
                title: "Intro to AI - Basics",
                duration: "18:32",
                slides: tinySlides("Intro to AI"),
                audioBlob: null,
                sizeKB: 120, // small packet size
            },
            {
                id: "l2",
                title: "VLSI - Fundamentals",
                duration: "22:10",
                slides: tinySlides("VLSI"),
                audioBlob: null,
                sizeKB: 98,
            },
        ];
    }

    function tinySlides(title) {
        // return array of tiny inline svg thumbnails (simulating compressed progressive images)
        return [
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23333'>${title} — Slide 1</text></svg>`,
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='100%' height='100%' fill='%23f1f5f9'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23333'>${title} — Slide 2</text></svg>`,
        ];
    }

    function loadLocalAnswers() {
        try {
            const raw = localStorage.getItem("rsr_quiz_answers_v1");
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveAnswers(newAnswers) {
        setQuizAnswers(newAnswers);
        localStorage.setItem("rsr_quiz_answers_v1", JSON.stringify(newAnswers));
    }

    function handleRoleToggle() {
        setRole((r) => (r === "student" ? "teacher" : "student"));
        setSelectedLesson(null);
    }

    // Teacher functions (mocked) -------------------------------------------------
    function teacherCreateLesson({ title }) {
        const newLesson = {
            id: `l${Date.now()}`,
            title,
            duration: "00:00",
            slides: tinySlides(title),
            audioBlob: null,
            sizeKB: 40,
        };
        setLessons((s) => [newLesson, ...s]);
    }

    function teacherStartRecording(lessonId) {
        setIsRecording(true);
        setTimeout(() => {
            // Simulate a recorded tiny audio by setting a small blob placeholder
            setLessons((s) =>
                s.map((l) => (l.id === lessonId ? { ...l, audioBlob: { url: null, sizeKB: 16 }, duration: "16:20" } : l))
            );
            setIsRecording(false);
            setSyncLog((log) => [`Recorded audio for ${lessonId} at ${new Date().toLocaleTimeString()}`, ...log].slice(0, 10));
        }, 1500); // demo delay
    }

    // Student functions ----------------------------------------------------------
    function downloadLessonPacket(lesson) {
        // Package small JSON with base64 svg slides and pretend audio small blob.
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
        setSyncLog((log) => [`Downloaded ${lesson.title} packet at ${new Date().toLocaleTimeString()}`, ...log].slice(0, 10));
    }

    function handleAnswer(lessonId, qId, answer) {
        const updated = { ...quizAnswers };
        if (!updated[lessonId]) updated[lessonId] = {};
        updated[lessonId][qId] = answer;
        saveAnswers(updated);
    }

    function simulateSync() {
        // Mock upload of locally stored answers (works offline-first)
        // In real app you would POST to server with retry/backoff.
        const timestamp = new Date().toLocaleString();
        setSyncLog((log) => [`Synced answers at ${timestamp}`, ...log].slice(0, 10));
        // clear local answers after sync (for demo)
        localStorage.removeItem("rsr_quiz_answers_v1");
        setQuizAnswers({});
    }

    // UI pieces -----------------------------------------------------------------
    const Header = () => (
        <header className="w-full w-3xl h-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-4 shadow-lg sticky top-0 z-30">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/20 p-2">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L20 6v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div>
                        <div className="text-lg font-semibold">Remote Schoolroom (Rural)</div>
                        <div className="text-xs opacity-80">Low-bandwidth PWA • Audio-first • Offline-ready</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleRoleToggle} className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30">Switch to {role === "student" ? "Teacher" : "Student"}</button>
                    <div className="text-sm text-white/90">Role: <span className="font-medium">{role}</span></div>
                </div>
            </div>
        </header>
    );

    const Sidebar = () => (
        <aside className="w-72 bg-white/5 p-4 rounded-xl shadow-inner hidden md:block">
            <div className="mb-4 text-sm text-white/80">Quick actions</div>
            <div className="flex flex-col gap-3">
                <button onClick={() => simulateSync()} className="px-3 py-2 text-sm rounded bg-white/10 hover:bg-white/20">Sync answers</button>
                <button onClick={() => alert('Open network settings demo')} className="px-3 py-2 text-sm rounded bg-white/10 hover:bg-white/20">Network test (throttle)</button>
                <div className="pt-2 border-t border-white/5 text-xs text-white/70">Logs</div>
                <div className="max-h-40 overflow-auto text-xs mt-2 space-y-2">
                    {syncLog.length === 0 && <div className="text-white/50">No logs yet</div>}
                    {syncLog.map((l, i) => (
                        <div key={i} className="p-2 bg-white/5 rounded">{l}</div>
                    ))}
                </div>
            </div>
        </aside>
    );

    const LessonCard = ({ lesson }) => (
        <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-white font-semibold">{lesson.title}</div>
                    <div className="text-xs text-white/70">Size: {lesson.sizeKB} KB • Duration: {lesson.duration}</div>
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedLesson(lesson); }} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-sm">Open</button>
                    <button onClick={() => downloadLessonPacket(lesson)} className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-sm">Download</button>
                </div>
            </div>
            <div className="flex gap-2">
                {lesson.slides.slice(0, 3).map((s, i) => (
                    <div key={i} className="w-24 h-14 rounded overflow-hidden border border-white/5">
                        <img alt={`slide-${i}`} src={`data:image/svg+xml;utf8,${encodeURIComponent(s)}`} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>
    );

    const TeacherPanel = () => {
        const [title, setTitle] = useState("");
        return (
            <div className="space-y-4">
                <div className="bg-white/6 rounded-xl p-4">
                    <div className="text-white font-semibold mb-2">Create a tiny lesson</div>
                    <div className="flex gap-2">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title (e.g., Intro to AI)" className="flex-1 px-3 py-2 rounded bg-white/5 text-white outline-none" />
                        <button onClick={() => { if (title.trim()) { teacherCreateLesson({ title: title.trim() }); setTitle(""); } }} className="px-4 py-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30">Create</button>
                    </div>
                </div>

                <div className="bg-white/6 rounded-xl p-4">
                    <div className="text-white font-semibold mb-2">Recording (simulated low-bitrate)</div>
                    <div className="flex items-center gap-2">
                        <select className="px-3 py-2 rounded bg-white/5 text-white" onChange={(e) => setSelectedLesson(lessons.find(l => l.id === e.target.value))} value={selectedLesson?.id || ""}>
                            <option value="">Select lesson to record</option>
                            {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                        </select>
                        <button disabled={!selectedLesson || isRecording} onClick={() => teacherStartRecording(selectedLesson.id)} className="px-3 py-2 rounded bg-rose-500/20 hover:bg-rose-500/30">{isRecording ? 'Recording...' : 'Start Recording'}</button>
                    </div>
                    <div className="text-xs text-white/70 mt-2">Tip: recorded audio is compressed to small packets (~16 kbps) in this prototype.</div>
                </div>
            </div>
        );
    };

    const StudentPanel = () => (
        <div className="bg-slate-800/60 rounded-xl p-6 shadow-xl">
            <div className="text-white text-lg font-semibold mb-2">Offline Quiz 📝</div>
            <div className="text-sm text-white/70 mb-4">Answers are saved locally and will sync when network is available.</div>
            <div className="space-y-4">
                {lessons.map(lesson => (
                    <div
                        key={lesson.id}
                        className="bg-slate-700/50 p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
                    >
                        <div className="font-medium text-white mb-3 flex items-center gap-2">
                            <span className="text-indigo-400">#</span>
                            <span>{lesson.title}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <QuizQuestion
                                lessonId={lesson.id}
                                qId={'q1'}
                                question={'What is the main idea of this lesson?'}
                                value={(quizAnswers[lesson.id] || {})['q1'] || ''}
                                onAnswer={(ans) => handleAnswer(lesson.id, 'q1', ans)}
                            />
                            <QuizQuestion
                                lessonId={lesson.id}
                                qId={'q2'}
                                question={'Rate clarity (1-5)'}
                                value={(quizAnswers[lesson.id] || {})['q2'] || ''}
                                onAnswer={(ans) => handleAnswer(lesson.id, 'q2', ans)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    function QuizQuestion({ lessonId, qId, question, value, onAnswer }) {
        return (
            <div>
                <div className="text-sm text-white/90">{question}</div>
                <input value={value} onChange={(e) => onAnswer(e.target.value)} className="mt-1 w-full px-2 py-1 rounded bg-white/5 text-white text-sm" />
            </div>
        );
    }

    const LessonDetail = () => {
        if (!selectedLesson) return (
            <div className="text-white/60 p-6 text-center italic">
                <p>Select a lesson from the list to view its details.</p>
                <p className="text-sm mt-2">You can download the lesson for offline study. 📥</p>
            </div>
        );

        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl transition-all duration-300">
                    {/* Main Content Area */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Lesson Info and Slides */}
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-2xl font-bold text-white tracking-wide">{selectedLesson.title}</h2>
                                <div className="text-sm text-sky-400 font-semibold bg-sky-400/10 rounded-full px-3 py-1">
                                    {selectedLesson.sizeKB} KB
                                </div>
                            </div>
                            <div className="text-sm text-white/60 mb-4">
                                Duration: {selectedLesson.duration} • <span className="text-emerald-400">Offline-ready</span>
                            </div>

                            {/* Slides Section */}
                            <div className="space-y-2 mb-6">
                                <h3 className="text-white font-medium text-lg">Lesson Slides</h3>
                                <div className="flex flex-wrap gap-4">
                                    {selectedLesson.slides.map((s, i) => (
                                        <div
                                            key={i}
                                            className="w-44 h-28 border border-white/10 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.05] hover:border-indigo-400"
                                        >
                                            <img
                                                alt={`slide-${i}`}
                                                src={`data:image/svg+xml;utf8,${encodeURIComponent(s)}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Audio and Download Section */}
                            <div className="bg-slate-700/50 p-4 rounded-xl shadow-inner">
                                <h3 className="text-white font-semibold mb-2">Audio Playback 🔊</h3>
                                <div className="flex items-center justify-between gap-4">
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
                                    <button
                                        onClick={() => downloadLessonPacket(selectedLesson)}
                                        className="px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors shadow-lg"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Sidebar (Optional) */}
                        <div className="w-full lg:w-64 bg-slate-700/50 rounded-xl p-4 shadow-inner">
                            <h3 className="text-sm text-white font-semibold mb-2">Quick Stats 📊</h3>
                            <ul className="text-xs text-white/80 space-y-2">
                                <li>Last updated: <span className="text-white/50">Sept 16, 2025</span></li>
                                <li>Total views: <span className="text-white/50">1,234</span></li>
                                <li>Quiz completions: <span className="text-white/50">98%</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
            <Header />
            <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                <div className="flex flex-col gap-4">
                    <Sidebar />
                </div>

                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            {role === 'teacher' ? <TeacherPanel /> : <StudentPanel />}
                        </div>
                        <div className="w-full md:w-96">
                            <div className="bg-white/6 rounded-xl p-4">
                                <div className="text-white font-semibold mb-2">Lesson detail</div>
                                <LessonDetail />
                            </div>

                            <div className="bg-white/6 rounded-xl p-4 mt-4">
                                <div className="text-white font-semibold mb-2">Connectivity hint</div>
                                <div className="text-xs text-white/70">This UI prioritizes: audio-first lessons, tiny slide packets (SVG thumbnails), and offline quizzes. Works well with limited data plans.</div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-8 p-4 text-center text-xs text-white/60">Remote Schoolroom — prototype • Tailwind v4.1 UI • Designed for low-bandwidth rural campuses</footer>
        </div>
    );
}
