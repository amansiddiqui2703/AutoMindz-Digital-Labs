import { useState, useEffect } from 'react';
import api from '../api/client';
import { KanbanSquare, MoreHorizontal, Clock, Building2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pipeline() {
    const [contacts, setContacts] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [loading, setLoading] = useState(true);

    const defaultStages = ['Lead', 'Contacted', 'Replied', 'Meeting', 'Customer'];

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (selectedCampaign) {
            fetchPipeline(selectedCampaign);
        } else {
            setContacts([]);
            setLoading(false);
        }
    }, [selectedCampaign]);

    const fetchCampaigns = async () => {
        try {
            const { data } = await api.get('/campaigns');
            setCampaigns(data.campaigns || []);
            if (data.campaigns?.length > 0) {
                setSelectedCampaign(data.campaigns[0]._id);
            }
        } catch (error) {
            toast.error('Failed to load campaigns');
        }
    };

    const fetchPipeline = async (campaignId) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/contacts?campaignId=${campaignId}`);
            setContacts(data.contacts || []);
        } catch (error) {
            toast.error('Failed to load pipeline');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e, contactId) => {
        e.dataTransfer.setData('contactId', contactId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStage) => {
        e.preventDefault();
        const contactId = e.dataTransfer.getData('contactId');
        
        // Optimistic update
        setContacts(prev => prev.map(c => 
            c._id === contactId ? { ...c, pipelineStage: targetStage } : c
        ));

        try {
            await api.patch(`/contacts/${contactId}/stage`, { pipelineStage: targetStage });
            toast.success('Contact moved successfully');
        } catch (error) {
            toast.error('Failed to move contact');
            fetchPipeline(selectedCampaign);
        }
    };

    const getStageContacts = (stage) => {
        return contacts.filter(c => (c.pipelineStage || 'Lead') === stage);
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <KanbanSquare className="w-6 h-6 text-primary-500" />
                        Pipeline
                    </h1>
                    <p className="text-sm text-surface-500 mt-1">Drag and drop contacts across stages</p>
                </div>
                <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="glass-card px-4 py-2 text-sm outline-none focus:ring-2 ring-primary-500/50 appearance-none bg-transparent"
                >
                    <option value="" disabled>Select Campaign</option>
                    {campaigns.map(c => (
                        <option key={c._id} value={c._id} className="dark:bg-surface-800">{c.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : selectedCampaign ? (
                <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
                    {defaultStages.map(stage => (
                        <div 
                            key={stage} 
                            className="flex-shrink-0 w-80 flex flex-col glass-card bg-surface-100/50 dark:bg-surface-900/50 rounded-2xl border-none p-4"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                        >
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="font-semibold text-surface-700 dark:text-surface-300">{stage}</h3>
                                <span className="text-xs font-medium bg-surface-200 dark:bg-surface-800 px-2.5 py-1 rounded-full text-surface-600 dark:text-surface-400">
                                    {getStageContacts(stage).length}
                                </span>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                                {getStageContacts(stage).map(contact => (
                                    <div
                                        key={contact._id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, contact._id)}
                                        className="glass-card p-4 bg-white dark:bg-surface-800 cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform duration-200"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-sm text-surface-900 dark:text-white truncate pr-2">
                                                {contact.name || 'Unknown'}
                                            </h4>
                                            <button className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-surface-500">
                                                <Mail className="w-3.5 h-3.5 text-primary-400" />
                                                <span className="truncate">{contact.email}</span>
                                            </div>
                                            {contact.company && (
                                                <div className="flex items-center gap-2 text-xs text-surface-500">
                                                    <Building2 className="w-3.5 h-3.5 text-accent-400" />
                                                    <span className="truncate">{contact.company}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[10px] text-surface-400 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                                                <Clock className="w-3 h-3" />
                                                <span>Last emailed: {contact.lastEmailed ? new Date(contact.lastEmailed).toLocaleDateString() : 'Never'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-surface-500">
                    Select a campaign to view the pipeline.
                </div>
            )}
        </div>
    );
}
