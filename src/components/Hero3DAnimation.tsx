"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Pill, Activity, ShieldCheck, PlusSquare } from "lucide-react";

const Hero3DAnimation = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center py-20 overflow-visible">
            {/* Background Decorative Circles */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute w-[300px] h-[300px] bg-green-400/20 rounded-full blur-3xl -bottom-10 -right-10"
            />

            {/* Main Floating 3D Kit / Capsule */}
            <motion.div
                className="relative z-20 w-72 h-72 md:w-96 md:h-96"
                initial={{ y: 0 }}
                animate={{ y: [-20, 20, -20] }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {/* Glassmorphic Container (Simulating a Premium Medical Case) */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden">
                    {/* Internal Glow */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent" />

                    {/* Centerpiece Icon */}
                    <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 10 }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Activity className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-gray-800 text-xl tracking-tight">PILLORA+</span>
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Health Network</span>
                        </div>
                    </motion.div>
                </div>

                {/* Orbiting Elements */}

                {/* Heart */}
                <motion.div
                    className="absolute -bottom-5 -right-5 w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <Heart className="w-10 h-10 text-red-500 fill-red-500/10" />
                </motion.div>

                {/* Activity */}
                <motion.div
                    className="absolute top-20 -right-12 w-14 h-14 bg-white rounded-xl shadow-xl flex items-center justify-center border border-gray-100"
                    animate={{
                        x: [0, -10, 0],
                        rotate: [0, -10, 0],
                    }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                >
                    <Activity className="w-7 h-7 text-green-500" />
                </motion.div>

                {/* Shield */}
                <motion.div
                    className="absolute bottom-20 -left-12 w-14 h-14 bg-white rounded-xl shadow-xl flex items-center justify-center border border-gray-100"
                    animate={{
                        y: [0, 10, 0],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                >
                    <ShieldCheck className="w-7 h-7 text-purple-500" />
                </motion.div>
            </motion.div>

            {/* Floating Sparkles / Particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-200 rounded-full"
                    initial={{
                        x: Math.random() * 400 - 200,
                        y: Math.random() * 400 - 200,
                        opacity: 0,
                    }}
                    animate={{
                        y: [0, -40, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 3,
                    }}
                />
            ))}
        </div>
    );
};

export default Hero3DAnimation;
