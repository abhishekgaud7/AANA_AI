import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all tasks
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM tasks ORDER BY done ASC, id DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST create new task
router.post('/', async (req, res) => {
    try {
        const { title, date } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Title is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO tasks (title, date, done, notified) VALUES (?, ?, 0, 0)',
            [title.trim(), date || null]
        );

        const [newTask] = await pool.query(
            'SELECT * FROM tasks WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newTask[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update task (toggle done, mark notified)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { done, notified } = req.body;

        const updates = [];
        const values = [];

        if (done !== undefined) {
            updates.push('done = ?');
            values.push(done ? 1 : 0);
        }

        if (notified !== undefined) {
            updates.push('notified = ?');
            values.push(notified ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        values.push(id);

        await pool.query(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updatedTask] = await pool.query(
            'SELECT * FROM tasks WHERE id = ?',
            [id]
        );

        if (updatedTask.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(updatedTask[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// GET pending reminders (for notification system)
router.get('/pending', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM tasks WHERE done = 0 AND notified = 0 AND date IS NOT NULL'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching pending reminders:', error);
        res.status(500).json({ error: 'Failed to fetch pending reminders' });
    }
});

export default router;
