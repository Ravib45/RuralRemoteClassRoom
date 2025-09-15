import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import LandingPage from "./pages/LandingPage";
// import StudentDashboard from "./pages/StudentDashboard";
// import TeacherDashboard from "./pages/TeacherDashboard";

import RemoteClassroomApp from './RemoteClassroomApp';

function App() {
  return (
    // <Router>
    //   <Routes>
    //     <Route path="/" element={<LandingPage />} />
    //     <Route path="/student" element={<StudentDashboard />} />
    //     <Route path="/teacher" element={<TeacherDashboard />} />
    //   </Routes>
    // </Router>
    <>
      <RemoteClassroomApp></RemoteClassroomApp>
    </>
  );
}

export default App;
