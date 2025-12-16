import Dexie from 'dexie';

export const db = new Dexie('OfflineJarvisDB');

db.version(1).stores({
    reminders: '++id, title, date, done, notified',
    notes: '++id, content, timestamp',
    facts: 'key, value',
    settings: 'key, value',
    chatMessages: '++id, role, text, timestamp' // New table for chat history
});

// Rename functions to match "Todo" terminology for clarity, though underlying DB is same
export const addTask = async (title, date) => {
    return await db.reminders.add({ title, date, done: 0, notified: 0 });
};

export const getTasks = async () => {
    // Return all reminders, sorted by status (pending first) then date
    // Sort logic handled in UI or here. Dexie sorting is simple.
    // Let's return array and sort in UI for flexibility.
    return await db.reminders.toArray();
};

export const updateTaskStatus = async (id, done) => {
    return await db.reminders.update(id, { done: done ? 1 : 0 });
};

export const deleteTask = async (id) => {
    return await db.reminders.delete(id);
};

// Keep for background check
export const getPendingReminders = async () => {
    return await db.reminders.where('done').equals(0).toArray();
};

export const markAsNotified = async (id) => {
    return await db.reminders.update(id, { notified: 1 });
};

// Chat storage functions
export const addChatMessage = async (role, text) => {
    return await db.chatMessages.add({
        role,
        text,
        timestamp: new Date().toISOString()
    });
};

export const getChatMessages = async () => {
    return await db.chatMessages.orderBy('id').toArray();
};

export const clearChatHistory = async () => {
    return await db.chatMessages.clear();
};
