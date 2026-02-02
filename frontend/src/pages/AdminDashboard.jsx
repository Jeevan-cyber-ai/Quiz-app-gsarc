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

    const [activeTab, setActiveTab] = useState("events"); 
    const [pendingUsers, setPendingUsers] = useState([]);

    const handleDownloadMarks = async (eventId, eventTitle) => {
        if (!eventId) return alert("Error: Event ID is missing.");
        try {
            setLoading(true);
            const res = await api.get(`/admin/events/${eventId}/marksheet`);
            const data = res.data; 

            if (!data || data.length === 0) return alert("No student data found.");

            const headers = ["Name", "Department","Technical Marks", "General Marks", "Total Marks"];
            const csvRows = [
                headers.join(','),
                ...data.map(row => [
                    `"${row.name}"`, 
                    `"${row.dept}"`, 
                    row.marks_technical || 0, 
                    row.marks_general || 0, 
                    row.marks || 0
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${eventTitle.replace(/\s+/g, '_')}_Marksheet.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert("Failed to generate marksheet");
        } finally {
            setLoading(false);
        }
    };

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
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(fetchDashboardData, 400);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, activeTab]);

    const handleApprovalAction = async (userId, status) => {
        try {
            await api.post('/admin/approve-user', { userId, status });
            setPendingUsers(pendingUsers.filter(u => u._id !== userId));
        } catch (err) { alert("Action failed"); }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/create-event', newEvent);
            setShowCreateModal(false);
            fetchDashboardData();
        } catch (err) { alert("Error creating event"); }
    };

    const handleClearData = async (eventId, type) => {
        if (!window.confirm(`Clear all ${type}? This cannot be undone.`)) return;
        try {
            const endpoint = type === 'students' 
                ? `/admin/events/${eventId}/clear-students` 
                : `/admin/events/${eventId}/clear-questions`;
            await api.get(endpoint);
            alert("Data cleared");
        } catch (err) { alert("Clear failed"); }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return alert("Select a file first");
        const formData = new FormData();
        formData.append("file", selectedFile);
        const endpoint = uploadConfig.type === "students" 
            ? `/admin/events/${uploadConfig.eventId}/upload-students`
            : `/admin/events/${uploadConfig.eventId}/upload-questions`;
        try {
            await api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
            setUploadConfig({ show: false, eventId: null, type: "" });
            setSelectedFile(null);
            alert("Upload Success!");
        } catch (err) { alert("Upload failed"); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-6">
            <div className="max-w-7xl mx-auto">
                
                {/* --- HEADER & STATS BAR --- */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div className="flex bg-[#141414] p-1.5 rounded-2xl border border-zinc-800 shadow-xl">
                        <button 
                            onClick={() => setActiveTab("events")}
                            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'events' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            EVENTS
                        </button>
                        <button 
                            onClick={() => setActiveTab("approvals")}
                            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            APPROVALS {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{pendingUsers.length}</span>}
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            {loading ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <span className="text-zinc-500">🔍</span>}
                        </div>
                        <input 
                            type="text" 
                            placeholder={activeTab === 'events' ? "Search Active Events..." : "Search Pending Students..."}
                            className="w-full pl-12 pr-4 py-3.5 bg-[#141414] rounded-2xl border border-zinc-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder-zinc-600 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {activeTab === 'events' && (
                        <button onClick={() => setShowCreateModal(true)} className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-3.5 px-8 rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            + CREATE EVENT
                        </button>
                    )}
                </div>

                {activeTab === 'events' ? (
                    /* --- EVENT CARDS --- */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div key={event._id} className="group bg-[#141414] rounded-[2rem] p-8 border border-zinc-800 hover:border-blue-500/50 transition-all flex flex-col shadow-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{event.title}</h3>
                                    <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{event.time}</span>
                                </div>
                                <p className="text-zinc-500 text-xs mb-4 flex items-center gap-2">
                                    <span className="text-blue-500">📍</span> {event.location}
                                </p>
                                <p className="text-zinc-400 text-sm mb-8 leading-relaxed line-clamp-2">{event.description}</p>
                                
                                <div className="mt-auto space-y-4">
                                    <button 
                                        onClick={() => handleDownloadMarks(event._id, event.title)} 
                                        className="w-full py-3 bg-zinc-800/50 hover:bg-amber-600/10 hover:text-amber-500 border border-zinc-700 hover:border-amber-500/50 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                                    >
                                        📊 DOWNLOAD MARKSHEET
                                    </button>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setUploadConfig({ show: true, eventId: event._id, type: "students" })} className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black hover:bg-emerald-600/10 hover:text-emerald-500 hover:border-emerald-500/50 transition-all">↑ STUDENTS</button>
                                        <button onClick={() => setUploadConfig({ show: true, eventId: event._id, type: "questions" })} className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black hover:bg-indigo-600/10 hover:text-indigo-500 hover:border-indigo-500/50 transition-all">↑ QUESTIONS</button>
                                    </div>
                                    
                                    <div className="flex justify-between px-2 pt-2">
                                        <button onClick={() => handleClearData(event._id, 'students')} className="text-[9px] font-black text-zinc-600 hover:text-red-500 transition-colors">CLEAR STUDENTS</button>
                                        <button onClick={() => handleClearData(event._id, 'questions')} className="text-[9px] font-black text-zinc-600 hover:text-red-500 transition-colors">CLEAR QUESTIONS</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* --- APPROVALS TABLE --- */
                    <div className="bg-[#141414] rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#1c1c1c] border-b border-zinc-800">
                                <tr>
                                    <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Candidate</th>
                                    <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest">Academic Info</th>
                                    <th className="p-6 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {pendingUsers.length === 0 ? (
                                    <tr><td colSpan="3" className="p-20 text-center text-zinc-600 font-bold uppercase tracking-tighter text-2xl">All Clear ✅</td></tr>
                                ) : (
                                    pendingUsers.map(user => (
                                        <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6">
                                                <div className="font-black text-white text-lg">{user.name}</div>
                                                <div className="text-xs text-zinc-500 font-medium tracking-wide">{user.email}</div>
                                            </td>
                                            <td className="p-6">
                                                <span className="bg-zinc-800 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-zinc-700">{user.dept} • Year {user.year}</span>
                                            </td>
                                            <td className="p-6 text-right space-x-3">
                                                <button onClick={() => handleApprovalAction(user._id, 'rejected')} className="text-[10px] font-black text-zinc-500 hover:text-red-500 px-4 py-2 transition-all">REJECT</button>
                                                <button onClick={() => handleApprovalAction(user._id, 'approved')} className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20">APPROVE</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODALS (Dark Theme Integrated) --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleCreateEvent} className="bg-[#141414] border border-zinc-800 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-6">
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Create New Event</h2>
                        <div className="space-y-4">
                            <input required type="text" placeholder="Event Title" className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 outline-none" onChange={(e)=>setNewEvent({...newEvent, title: e.target.value})} />
                            <div className="flex gap-4">
                                <input required type="date" className="w-1/2 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" onChange={(e)=>setNewEvent({...newEvent, date: e.target.value})} />
                                <input required type="text" placeholder="10:00 AM" className="w-1/2 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" onChange={(e)=>setNewEvent({...newEvent, time: e.target.value})} />
                            </div>
                            <input required type="text" placeholder="Location" className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" onChange={(e)=>setNewEvent({...newEvent, location: e.target.value})} />
                            <textarea required placeholder="Brief Description..." className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none h-32" onChange={(e)=>setNewEvent({...newEvent, description: e.target.value})} />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={()=>setShowCreateModal(false)} className="flex-1 py-4 font-black text-zinc-500 hover:text-white transition-all">DISCARD</button>
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all">SAVE EVENT</button>
                        </div>
                    </form>
                </div>
            )}

            {uploadConfig.show && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-zinc-800 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl">
                        <h2 className="text-xl font-black mb-8 text-white uppercase text-center tracking-widest">Upload {uploadConfig.type}</h2>
                        <div className="group border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center hover:border-blue-500/50 transition-all cursor-pointer relative bg-zinc-900/50">
                            <input type="file" accept=".xlsx, .xls, .csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files[0])} />
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📁</div>
                            <span className="text-xs text-zinc-500 font-black block truncate">{selectedFile ? selectedFile.name : "BROWSE FILES"}</span>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button onClick={() => {setUploadConfig({show:false}); setSelectedFile(null)}} className="flex-1 py-4 font-black text-zinc-500 hover:text-white transition-all text-xs">CANCEL</button>
                            <button onClick={handleFileUpload} className="flex-1 bg-white text-black py-4 rounded-2xl font-black shadow-xl hover:bg-zinc-200 transition-all text-xs">UPLOAD</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;