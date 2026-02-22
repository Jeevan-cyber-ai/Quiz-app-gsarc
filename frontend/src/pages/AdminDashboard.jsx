import React, { useState, useEffect } from 'react';
import api from '../utils/api.jsx';

const AdminDashboard = () => {
    // --- Existing States ---
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [uploadConfig, setUploadConfig] = useState({ show: false, eventId: null, type: "" });
    const [selectedFile, setSelectedFile] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", description: "", location: "" });
    const [activeTab, setActiveTab] = useState("events");
    const [pendingUsers, setPendingUsers] = useState([]);

    // --- NEW: Management States ---
    const [managingEvent, setManagingEvent] = useState(null); 
    const [eventStudents, setEventStudents] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    // --- NEW FOR STUDENT EDITING ---
    const [editingStudent, setEditingStudent] = useState(null);
    const [isSavingStudent, setIsSavingStudent] = useState(false);

    // --- Data Fetching ---
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
        } catch (err) { console.error("Fetch Error:", err); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(fetchDashboardData, 400);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, activeTab]);

    // --- NEW: Event & Student Management Actions ---

    const openManageHub = async (event) => {
        setManagingEvent(event);
        try {
            // fetch students for the specific event
            const res = await api.get(`/admin/events/${event._id}/students`);
            // backend returns { students: [...] }
            const list = res.data?.students || [];
            setEventStudents(list);
        } catch (err) {
            console.error("Failed to fetch students for event", err);
            setEventStudents([]);
        }
    };

    const handleUpdateEvent = async () => {
        setIsUpdating(true);
        try {
            // backend route is PATCH /admin/events/:id/update
            const res = await api.patch(`/admin/events/${managingEvent._id}/update`, managingEvent);
            // controller returns { message, updatedEvent }
            setEvents(events.map(ev => ev._id === managingEvent._id ? res.data.updatedEvent : ev));
            alert("Event Updated Successfully");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Update failed";
            alert(`Update failed: ${msg}`);
        } finally { setIsUpdating(false); }
    };

    const handleResetStudent = async (studentId) => {
        if (!window.confirm("Reset student attempts and marks?")) return;
        try {
            // Route: adminRoutes.post('/students/:id/reset')
            await api.post(`/admin/students/${studentId}/reset`);
            
            // Update local UI state
            setEventStudents(prev => prev.map(s => 
                s._id === studentId ? { ...s, attempt: 0, marks: 0, isDisqualified: false, warningCount: 0 } : s
            ));
            alert("Student Reset Successful");
        } catch (err) {
            alert("Reset Failed");
        }
    };

    // --- NEW: student update handler ---
    const handleSaveStudent = async () => {
        if (!editingStudent) return;
        setIsSavingStudent(true);
        try {
            const res = await api.patch(`/admin/students/${editingStudent._id}/update`, editingStudent);
            setEventStudents(prev => prev.map(s => s._id === editingStudent._id ? res.data : s));
            setEditingStudent(null);
            alert("Student updated successfully");
        } catch (err) {
            alert("Failed to update student");
        } finally {
            setIsSavingStudent(false);
        }
    };

    // --- Original Actions (Maintained) ---
    const handleDownloadMarks = async (eventId, eventTitle) => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/events/${eventId}/marksheet`);
            const data = res.data;
            if (!data || data.length === 0) return alert("No student data found.");
            const headers = ["Name", "Department", "Technical Marks", "General Marks", "Total Marks"];
            const csvRows = [headers.join(','), ...data.map(row => [`"${row.name}"`,`"${row.dept}"`,row.marks_technical || 0,row.marks_general || 0,row.marks || 0].join(','))].join('\n');
            const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${eventTitle.replace(/\s+/g, '_')}_Marksheet.csv`);
            link.click();
        } catch (err) { alert("Failed to generate marksheet"); } 
        finally { setLoading(false); }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/admin/create-event', newEvent);
            setShowCreateModal(false);
            setNewEvent({ title: "", date: "", time: "", description: "", location: "" });
            fetchDashboardData();
        } catch (err) { alert("Error creating event"); } 
        finally { setLoading(false); }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return alert("Select a file first");
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        const endpoint = uploadConfig.type === "students" ? `/admin/events/${uploadConfig.eventId}/upload-students` : `/admin/events/${uploadConfig.eventId}/upload-questions`;
        try {
            await api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
            setUploadConfig({ show: false, eventId: null, type: "" });
            setSelectedFile(null);
            alert("Upload Success!");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Upload failed";
            alert(`Upload failed: ${msg}`);
        } 
        finally { setUploading(false); }
    };

    const handleClearData = async (eventId, type) => {
        if (!window.confirm(`Clear all ${type}?`)) return;
        try {
            const endpoint = type === 'students' ? `/admin/events/${eventId}/clear-students` : `/admin/events/${eventId}/clear-questions`;
            await api.delete(endpoint);
            alert(`${type} cleared.`);
        } catch (err) { alert("Clear failed"); }
    };

    const handleApprovalAction = async (userId, status) => {
        try {
            await api.post('/admin/approve-user', { userId, status });
            setPendingUsers(pendingUsers.filter(u => u._id !== userId));
        } catch (err) { alert("Action failed"); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div className="flex bg-[#141414] p-1.5 rounded-2xl border border-zinc-800 shadow-xl">
                        <button onClick={() => setActiveTab("events")} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'events' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}>EVENTS</button>
                        <button onClick={() => setActiveTab("approvals")} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}>APPROVALS {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{pendingUsers.length}</span>}</button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-3.5 bg-[#141414] rounded-2xl border border-zinc-800 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder-zinc-600 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    {activeTab === 'events' && (
                        <button onClick={() => setShowCreateModal(true)} className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-3.5 px-8 rounded-2xl shadow-xl hover:scale-[1.02] transition-all">+ CREATE EVENT</button>
                    )}
                </div>

                {/* --- EVENTS GRID --- */}
                {activeTab === 'events' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div key={event._id} className="group bg-[#141414] rounded-[2.5rem] p-8 border border-zinc-800 hover:border-blue-500/50 transition-all flex flex-col shadow-2xl relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{event.title}</h3>
                                    <button onClick={() => openManageHub(event)} className="bg-blue-600/10 text-blue-500 text-[9px] font-black px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">MANAGE HUB</button>
                                </div>
                                <p className="text-zinc-500 text-xs mb-4">📍 {event.location} • {event.time}</p>
                                <p className="text-zinc-400 text-sm mb-8 line-clamp-2">{event.description}</p>
                                
                                <div className="mt-auto space-y-4">
                                    <button onClick={() => handleDownloadMarks(event._id, event.title)} className="w-full py-3 bg-zinc-800/30 hover:bg-amber-600/10 hover:text-amber-500 border border-zinc-800 hover:border-amber-500/50 rounded-xl text-xs font-black transition-all">📊 DOWNLOAD MARKSHEET</button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setUploadConfig({ show: true, eventId: event._id, type: "students" })} className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black hover:text-emerald-500 transition-all uppercase">↑ Students</button>
                                        <button onClick={() => setUploadConfig({ show: true, eventId: event._id, type: "questions" })} className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black hover:text-indigo-500 transition-all uppercase">↑ Questions</button>
                                    </div>
                                    <div className="flex justify-between px-2 pt-2 border-t border-zinc-800/50">
                                        <button onClick={() => handleClearData(event._id, 'students')} className="text-[9px] font-black text-zinc-600 hover:text-red-500 transition-colors uppercase">Clear Std</button>
                                        <button onClick={() => handleClearData(event._id, 'questions')} className="text-[9px] font-black text-zinc-600 hover:text-red-500 transition-colors uppercase">Clear Que</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Approvals Table */
                    <div className="bg-[#141414] rounded-[2.5rem] border border-zinc-800 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#1c1c1c] border-b border-zinc-800">
                                <tr>
                                    <th className="p-6 text-xs font-black text-zinc-500 uppercase">Candidate</th>
                                    <th className="p-6 text-xs font-black text-zinc-500 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map(user => (
                                    <tr key={user._id} className="border-b border-zinc-800/50">
                                        <td className="p-6">
                                            <div className="font-black text-white">{user.name}</div>
                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <button onClick={() => handleApprovalAction(user._id, 'rejected')} className="text-[10px] font-black text-zinc-600 hover:text-red-500">REJECT</button>
                                            <button onClick={() => handleApprovalAction(user._id, 'approved')} className="bg-emerald-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Approve</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MANAGE HUB DRAWER (FOR RESET & UPDATE) --- */}
            {managingEvent && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex justify-end">
                    <div className="w-full max-w-2xl bg-[#0f0f0f] border-l border-zinc-800 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Manage: {managingEvent.title}</h2>
                            <button onClick={() => setManagingEvent(null)} className="text-zinc-500 hover:text-white text-2xl font-black">✕</button>
                        </div>

                        {/* EDIT EVENT DETAILS */}
                        <div className="mb-10 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
                            <h3 className="text-xs font-black text-blue-500 uppercase mb-4 tracking-widest">Update Event Info</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm" value={managingEvent.title} onChange={(e)=>setManagingEvent({...managingEvent, title: e.target.value})} />
                                <input className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm" value={managingEvent.location} onChange={(e)=>setManagingEvent({...managingEvent, location: e.target.value})} />
                            </div>
                            <button onClick={handleUpdateEvent} disabled={isUpdating} className="w-full bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{isUpdating ? "Updating..." : "Save Event Details"}</button>
                        </div>

                        {/* STUDENT LIST & RESET */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            <h3 className="text-xs font-black text-red-500 uppercase mb-4 tracking-widest">Student Controls</h3>
                            <div className="space-y-3">
                                {eventStudents.length > 0 ? eventStudents.map(student => (
                                    <div key={student._id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center group">
                                        <div>
                                            <div className="font-black text-sm text-white">{student.name}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-black">Marks: {student.marks} | Attempt: {student.attempt}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingStudent(student)} className="bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase">Edit</button>
                                            <button onClick={() => handleResetStudent(student._id)} className="bg-red-600/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all uppercase">Reset</button>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-zinc-700 font-black py-10">NO STUDENTS REGISTERED</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STUDENT EDIT MODAL --- */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[160] flex items-center justify-center">
                    <div className="bg-[#141414] p-8 rounded-3xl w-full max-w-lg border border-zinc-800 shadow-2xl">
                        <h3 className="text-lg font-black text-white mb-6">Edit Student</h3>
                        <div className="space-y-4">
                            <input className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm" value={editingStudent.name} onChange={e=>setEditingStudent({...editingStudent, name: e.target.value})} placeholder="Name" />
                            <input className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm" value={editingStudent.email} onChange={e=>setEditingStudent({...editingStudent, email: e.target.value})} placeholder="Email" />
                            <input className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm" value={editingStudent.dept || ''} onChange={e=>setEditingStudent({...editingStudent, dept: e.target.value})} placeholder="Department" />
                            <div className="grid grid-cols-2 gap-4">
                                <input className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm" type="number" value={editingStudent.marks || 0} onChange={e=>setEditingStudent({...editingStudent, marks: Number(e.target.value)})} placeholder="Marks" />
                                <input className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm" type="number" value={editingStudent.attempt || 0} onChange={e=>setEditingStudent({...editingStudent, attempt: Number(e.target.value)})} placeholder="Attempt" />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={()=>setEditingStudent(null)} className="flex-1 py-3 font-black text-zinc-500">CANCEL</button>
                            <button onClick={handleSaveStudent} disabled={isSavingStudent} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black">{isSavingStudent ? 'SAVING...' : 'SAVE CHANGES'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PRE-EXISTING MODALS (CREATE & UPLOAD) --- */}
            {/* These remain the same as your provided code for Create and Upload modals */}
            {showCreateModal && (
                 <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleCreateEvent} className="bg-[#141414] border border-zinc-800 rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-5">
                         <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">Create New Event</h2>
                         <div className="space-y-4">
                             <input required type="text" placeholder="Event Title" className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" value={newEvent.title} onChange={(e)=>setNewEvent({...newEvent, title: e.target.value})} />
                             <div className="flex gap-4">
                                 <input required type="date" className="w-1/2 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" value={newEvent.date} onChange={(e)=>setNewEvent({...newEvent, date: e.target.value})} />
                                 <input required type="text" placeholder="10:00 AM" className="w-1/2 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" value={newEvent.time} onChange={(e)=>setNewEvent({...newEvent, time: e.target.value})} />
                             </div>
                             <input required type="text" placeholder="Location" className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none" value={newEvent.location} onChange={(e)=>setNewEvent({...newEvent, location: e.target.value})} />
                             <textarea required placeholder="Brief Description..." className="w-full p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-white outline-none h-32 resize-none" value={newEvent.description} onChange={(e)=>setNewEvent({...newEvent, description: e.target.value})} />
                         </div>
                         <div className="flex gap-4 pt-4">
                             <button type="button" onClick={()=>setShowCreateModal(false)} className="flex-1 py-4 font-black text-zinc-500">DISCARD</button>
                             <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">{loading ? "SAVING..." : "SAVE EVENT"}</button>
                         </div>
                     </form>
                 </div>
            )}

            {uploadConfig.show && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-zinc-800 rounded-[3rem] p-10 max-w-sm w-full shadow-2xl">
                        <h2 className="text-xl font-black mb-8 text-white uppercase text-center tracking-widest">Upload {uploadConfig.type}</h2>
                        <div className="group border-2 border-dashed border-zinc-800 rounded-[2rem] p-12 text-center relative bg-zinc-900/30 hover:border-blue-500/50 transition-all">
                            <input type="file" accept=".xlsx, .xls, .csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files[0])} />
                            <div className="text-5xl mb-4">📁</div>
                            <span className="text-[10px] text-zinc-500 font-black block truncate">
                                {selectedFile ? selectedFile.name : "BROWSE CSV / EXCEL"}
                            </span>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button onClick={() => {setUploadConfig({show:false}); setSelectedFile(null)}} className="flex-1 py-4 font-black text-zinc-500">CANCEL</button>
                            <button onClick={handleFileUpload} disabled={uploading} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase">
                                {uploading ? "Uploading..." : "Confirm Upload"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;