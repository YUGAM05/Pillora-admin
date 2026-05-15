"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Calendar, ArrowRight, Activity } from 'lucide-react';
import Image from 'next/image';

interface HealthTip {
    _id: string;
    title: string;
    description: string;
    date: string;
    imageUrl?: string;
}

export default function HealthHubSection() {
    const [tips, setTips] = useState<HealthTip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            try {
                // Fetch all tips (controller sorts by date desc), then take slice
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health-hub`);
                setTips(response.data.slice(0, 3)); // Take only top 3
            } catch (error) {
                console.error('Error fetching tips:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTips();
    }, []);

    const defaultTips: HealthTip[] = [
        {
            _id: 'default-1',
            title: '10 Essential Tips for a Healthy Heart',
            description: 'Discover simple daily habits that can significantly improve your cardiovascular health and boost your energy levels.',
            date: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&auto=format&fit=crop&q=60'
        },
        {
            _id: 'default-2',
            title: 'Understanding Your Blood Test Results',
            description: 'A comprehensive guide to decoding your lab reports and knowing when it is time to consult your doctor.',
            date: new Date(Date.now() - 86400000).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60'
        },
        {
            _id: 'default-3',
            title: 'Mental Wellness in the Modern Age',
            description: 'Practical strategies for managing stress, improving sleep, and maintaining mental clarity in a busy world.',
            date: new Date(Date.now() - 172800000).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60'
        }
    ];

    const displayTips = tips.length > 0 ? tips : defaultTips;

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Health Hub</h2>
                        <p className="mt-2 text-gray-600">Latest medical news and daily health tips</p>
                    </div>
                    <Link
                        href="/health-hub"
                        className="hidden sm:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? null : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayTips.map((tip) => (
                            <Link
                                href="/health-hub"
                                key={tip._id}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full"
                            >
                                <div className="relative h-48 w-full bg-blue-50 overflow-hidden">
                                    {tip.imageUrl ? (
                                        <Image
                                            src={tip.imageUrl}
                                            alt={tip.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-blue-200">
                                            <Activity className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(tip.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {tip.title}
                                    </h3>
                                    <p className="text-gray-600 line-clamp-2 text-sm flex-1">
                                        {tip.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center sm:hidden">
                    <Link
                        href="/health-hub"
                        className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
