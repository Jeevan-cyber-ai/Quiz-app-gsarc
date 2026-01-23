import React, { useState, useEffect } from 'react';
import api from '../utils/api.jsx';

const AdminDashboard = () => {
    // Existing States
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [uploadConfig, setUploadConfig] = useState({ show: false, eventId: null, type: "" });
    const [selectedFile, setSelectedFile] = useState(null);
    const [newEvent, setNewEvent] = useState({
        title: "", date: "", time: "", description: "", location: ""
    });

    // --- NEW STATES FOR APPROVAL SYSTEM ---
    const [activeTab, setActiveTab] = useState("events"); // 'events' or 'approvals'
    const [pendingUsers, setPendingUsers] = useState([]);

    // 1. Fetch Events & Pending Users
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            if (activeTab === "events") {
                const res = await api.get(`/admin/events?search=${searchTerm}`);
                setEvents(res.data.events || []);
            } else {
                const res = await api.get('/admin/pending-approvals');
                setPendingUsers(res.data || []);
            }
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(fetchDashboardData, 400);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, activeTab]);

    // --- NEW APPROVAL LOGIC ---
    const handleApprovalAction = async (userId, status) => {
        try {
            await api.post('/admin/approve-user', { userId, status });
            setPendingUsers(pendingUsers.filter(u => u._id !== userId));
            alert(`User ${status} successfully`);
        } catch (err) {
            alert("Action failed");
        }
    };

    // Existing Create Event Logic
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/create-event', newEvent);
            alert("Event Created!");
            setShowCreateModal(false);
            fetchDashboardData();
        } catch (err) { alert("Error creating event"); }
    };

    // Existing Clear Data Logic
    const handleClearData = async (eventId, type) => {
        if (!window.confirm(`Are you sure?`)) return;
        try {
            const endpoint = type === 'students' 
                ? `/admin/events/${eventId}/clear-students` 
                : `/admin/events/${eventId}/clear-questions`;
            const res = await api.get(endpoint);
            alert(res.data.message);
        } catch (err) { alert("Clear failed"); }
    };

    // Existing File Upload Logic
    const handleFileUpload = async () => {
        if (!selectedFile) return alert("Select a file first");
        const formData = new FormData();
        formData.append("file", selectedFile);
        const endpoint = uploadConfig.type === "students" 
            ? `/admin/events/${uploadConfig.eventId}/upload-students`
            : `/admin/events/${uploadConfig.eventId}/upload-questions`;
        try {
            const res = await api.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert(res.data.message);
            setUploadConfig({ show: false, eventId: null, type: "" });
            setSelectedFile(null);
        } catch (err) { alert("Upload failed"); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* --- TOP NAV & SEARCH --- */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <button 
                        onClick={() => setActiveTab("events")}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'events' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        Events
                    </button>
                    <button 
                        onClick={() => setActiveTab("approvals")}
                        className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        Approvals {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>}
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <div className="absolute left-3 top-3.5">
                        {loading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <span className="text-slate-400">🔍</span>}
                    </div>
                    <input 
                        type="text" 
                        placeholder={activeTab === 'events' ? "Search events..." : "Search students..."}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeTab === 'events' && (
                    <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:bg-blue-700 transition-all">+ Create Event</button>
                )}
            </div>

            <div className="max-w-7xl mx-auto">
                {activeTab === 'events' ? (
                    /* --- EVENT CARDS GRID --- */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div key={event._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded uppercase">{event.time}</span>
                                </div>
                                <p className="text-slate-400 text-xs mb-4">📍 {event.location}</p>
                                <p className="text-slate-500 text-sm mb-6 flex-grow">{event.description}</p>
                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => setUploadConfig({ show: true, eventId: event._id, type: "students" })} className="flex-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100">↑ Students</button>
                                        <button onClick={() => setUploadConfig({ show: true, eventId: event._id, type: "questions" })} className="flex-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 py-2 rounded-lg hover:bg-indigo-100">↑ Questions</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleClearData(event._id, 'students')} className="flex-1 text-[10px] font-bold text-red-400 hover:text-red-600 py-1">Clear Students</button>
                                        <button onClick={() => handleClearData(event._id, 'questions')} className="flex-1 text-[10px] font-bold text-red-400 hover:text-red-600 py-1">Clear Questions</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* --- PENDING APPROVALS LIST --- */
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-5 text-sm font-bold text-slate-600">Candidate Info</th>
                                    <th className="p-5 text-sm font-bold text-slate-600">Department</th>
                                    <th className="p-5 text-sm font-bold text-slate-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingUsers.length === 0 ? (
                                    <tr><td colSpan="3" className="p-10 text-center text-slate-400">No pending approvals found.</td></tr>
                                ) : (
                                    pendingUsers.map(user => (
                                        <tr key={user._id} className="hover:bg-slate-50/50">
                                            <td className="p-5">
                                                <div className="font-bold text-slate-800">{user.name}</div>
                                                <div className="text-xs text-slate-400">{user.email}</div>
                                            </td>
                                            <td className="p-5">
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{user.dept} - {user.year} Year</span>
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => handleApprovalAction(user._id, 'rejected')} className="text-xs font-bold text-red-500 px-4 py-2 hover:bg-red-50 rounded-xl">Reject</button>
                                                <button onClick={() => handleApprovalAction(user._id, 'approved')} className="text-xs font-bold bg-emerald-600 text-white px-5 py-2 rounded-xl shadow-lg hover:bg-emerald-700">Approve</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODALS (KEEP EXISTING) --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleCreateEvent} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4">
                        <h2 className="text-2xl font-black text-slate-800 uppercase">New Event</h2>
                        <input required type="text" placeholder="Event Title" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-blue-500" onChange={(e)=>setNewEvent({...newEvent, title: e.target.value})} />
                        <div className="flex gap-4">
                            <input required type="date" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" onChange={(e)=>setNewEvent({...newEvent, date: e.target.value})} />
                            <input required type="text" placeholder="10:00 AM" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none" onChange={(e)=>setNewEvent({...newEvent, time: e.target.value})} />
                        </div>
                        <input required type="text" placeholder="Location" className="w-full p-3 bg-slate-50 rounded-xl outline-none" onChange={(e)=>setNewEvent({...newEvent, location: e.target.value})} />
                        <textarea required placeholder="Description" className="w-full p-3 bg-slate-50 rounded-xl outline-none" onChange={(e)=>setNewEvent({...newEvent, description: e.target.value})} />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={()=>setShowCreateModal(false)} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Save Event</button>
                        </div>
                    </form>
                </div>
            )}

            {uploadConfig.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-sm w-full shadow-2xl">
                        <h2 className="text-xl font-black mb-6 text-slate-800 uppercase text-center">Upload {uploadConfig.type}</h2>
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-blue-400 transition-all cursor-pointer relative">
                            <input type="file" accept=".xlsx, .xls, .csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files[0])} />
                            <div className="text-4xl mb-2">📁</div>
                            <span className="text-xs text-slate-500 font-medium">{selectedFile ? selectedFile.name : "Select Excel File"}</span>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => {setUploadConfig({show:false}); setSelectedFile(null)}} className="flex-1 py-3 font-bold text-slate-400">Cancel</button>
                            <button onClick={handleFileUpload} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">Upload Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;