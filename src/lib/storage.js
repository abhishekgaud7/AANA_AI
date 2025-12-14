import Dexie from 'dexie';

export const db = new Dexie('OfflineJarvisDB');

db.version(1).stores({
    reminders: '++id, title, date, done',
    notes: '++id, content, timestamp',
    facts: 'key, value', // key examples: 'userName', 'spouseName'
    settings: 'key, value'
});

export const addReminder = async (title, date) => {
    return await db.reminders.add({ title, date, done: 0 });
};

export const getPendingReminders = async () => {
    const now = new Date().toISOString();
    // Simple check: reminders where done is 0
    return await db.reminders.where('done').equals(0).toArray();
};

export const addNote = async (content) => {
    return await db.notes.add({ content, timestamp: new Date() });
};

export const saveFact = async (key, value) => {
    return await db.facts.put({ key, value });
};

export const getFact = async (key) => {
    const fact = await db.facts.get(key);
    return fact ? fact.value : null;
};
