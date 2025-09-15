import React, { useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa'; // Make sure to install react-icons
import RemoteClassroomApp from './RemoteClassroomApp';

const LandingPage = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const darkModeClasses = isDarkMode
        ? "bg-gray-900 text-gray-100"
        : "bg-gradient-to-br from-purple-700 to-blue-500 text-white";

    return (
        <div className={`min-h-screen font-poppins transition-colors duration-500 ${darkModeClasses}`}>

            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-10 p-6 flex justify-between items-center">
                <a href="#" className="text-2xl font-bold">
                    YourBrand
                </a>
                <nav>
                    <ul className="flex items-center space-x-6">
                        <li><a href="#" className="font-semibold hover:text-purple-300 transition-colors duration-300">Features</a></li>
                        <li><a href="#" className="font-semibold hover:text-purple-300 transition-colors duration-300">Pricing</a></li>
                        <li><a href="#" className="font-semibold hover:text-purple-300 transition-colors duration-300">About Us</a></li>
                        <li><a href="#" className="font-semibold hover:text-purple-300 transition-colors duration-300">Contact</a></li>
                        <li>
                            <button
                                onClick={toggleDarkMode}
                                className={`p-2 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white text-blue-500 hover:text-purple-700'}`}
                            >
                                {isDarkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
                            </button>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="bg-white text-blue-500 font-semibold py-2 px-6 rounded-full shadow-md hover:scale-105 transform transition-transform duration-300"
                            >
                                Login
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex items-center justify-center min-h-screen text-center p-4">
                <div className="max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
                        Discover a New Way to Create
                    </h1>
                    <p className="text-lg md:text-xl opacity-80 mb-8">
                        Our platform helps you bring your ideas to life with powerful tools and a seamless user experience. Join thousands of creators who are building something amazing.
                    </p>
                    <a
                        href="#"
                        className="bg-white text-blue-500 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300"
                    >
                        Get Started Now
                    </a>
                </div>
            </main>

        </div>
    );
};

export default LandingPage;