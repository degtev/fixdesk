import { useState } from 'react';
import axios from 'axios';
import { BugAttachment } from '../types/project';

export const useAttachments = () => {
    const [attachments, setAttachments] = useState<BugAttachment[]>([]);

    const loadAttachments = async (bugId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/bugs/${bugId}/attachments`,
                config
            );
            setAttachments(response.data);
        } catch (error) {

        }
    };

    const uploadFile = async (bugId: number, file: File) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const formData = new FormData();
            formData.append('file', file);

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/bugs/${bugId}/attachments/file`,
                formData,
                config
            );

            await loadAttachments(bugId);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    };

    const addLink = async (bugId: number, link: { name: string; url: string }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/bugs/${bugId}/attachments/link`,
                link,
                config
            );

            await loadAttachments(bugId);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    };

    const deleteAttachment = async (attachmentId: number, bugId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/attachments/${attachmentId}`,
                config
            );

            await loadAttachments(bugId);
        } catch (error: any) {
            throw error;
        }
    };

    const uploadMultipleAttachments = async (
        bugId: number,
        files: File[],
        links: { name: string; url: string }[]
    ) => {
        try {
            for (const file of files) {
                await uploadFile(bugId, file);
            }

            for (const link of links) {
                await addLink(bugId, link);
            }
        } catch (error) {
            throw error;
        }
    };

    return {
        attachments,
        loadAttachments,
        uploadFile,
        addLink,
        deleteAttachment,
        uploadMultipleAttachments
    };
}; 