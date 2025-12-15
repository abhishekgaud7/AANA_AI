import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Task API functions
export const taskService = {
    // Get all tasks
    async getAllTasks() {
        try {
            const response = await api.get('/tasks');
            return response.data;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    },

    // Create new task
    async createTask(title, date = null) {
        try {
            const response = await api.post('/tasks', { title, date });
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    // Update task status
    async updateTask(id, updates) {
        try {
            const response = await api.put(`/tasks/${id}`, updates);
            return response.data;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    // Delete task
    async deleteTask(id) {
        try {
            const response = await api.delete(`/tasks/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    },

    // Get pending reminders
    async getPendingReminders() {
        try {
            const response = await api.get('/tasks/pending');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending reminders:', error);
            throw error;
        }
    },

    // Check if server is available
    async checkHealth() {
        try {
            const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 2000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    },
};

export default taskService;
