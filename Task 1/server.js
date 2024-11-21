const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const fileName = `${file.fieldname}-${Date.now()}.png`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage,
});

// MongoDB connection
const url = 'mongodb+srv://suthakar:suthakar123@cluster0.8gdct.mongodb.net';
const dbName = 'DTevents';
let db;

MongoClient.connect(url, { useUnifiedTopology: true })
    .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    })
    .catch((err) => console.error('Failed to connect to MongoDB:', err));


// 1. Get an event by its unique id
app.get('/api/v3/app/events', async (req, res) => {
    try {
    const { id, type, limit = 5, page = 1 } = req.query;

    if (id) {
        const event = await db
        .collection('events')
        .findOne({ _id: new ObjectId(id) });

        return event ? res.status(200).json(event) : res.status(404).json({ message: 'Event not found' });
    }

    if (type === 'latest') {
        const events = await db
        .collection('events')
        .find()
        // .sort({ schedule: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .toArray();
        return res.status(200).json(events);
    }

    res.status(400).json({ message: 'Invalid query parameters' });
    } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
    }
});

// 2. Create an event
app.post('/api/v3/app/events', upload.single('image'), async (req, res) => {
    try {
    const event = {
        name: req?.body?.name,
        tagline: req?.body?.tagline,
        schedule: req?.body?.schedule,
        description: req?.body?.description,
        files: req.file ? req.file.path : null,
        moderator: req?.body?.moderator,
        category: req?.body?.category,
        sub_category: req?.body?.sub_category,
        rigor_rank: parseInt(req?.body?.rigor_rank),
        attendees: [],
        type: 'event',
    };

    const result = await db.collection('events').insertOne(event);
    res.status(201).json(event);
    } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
    }
});

// 3. Update an event
app.put('/api/v3/app/events/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;

        const updatedEvent = {};

        if(req.body.name || req.body.tagline || req.body.schedule|| req.body.description || req?.file || req.body.moderator || req.body.category || req.body.sub_category || req.body.rigor_rank){
            if (req.body.name) updatedEvent.name = req.body.name;
            if (req.body.tagline) updatedEvent.tagline = req.body.tagline;
            if (req.body.schedule) updatedEvent.schedule = req.body.schedule;
            if (req.body.description) updatedEvent.description = req.body.description;
            if (req.file) updatedEvent.files = req.file.path;
            if (req.body.moderator) updatedEvent.moderator = req.body.moderator;
            if (req.body.category) updatedEvent.category = req.body.category;
            if (req.body.sub_category) updatedEvent.sub_category = req.body.sub_category;
            if (req.body.rigor_rank) updatedEvent.rigor_rank = parseInt(req.body.rigor_rank);
        }
        else{
            return res.status(400).json({ message: 'No fields provided to update' });
        }

        const result = await db.collection('events').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedEvent }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating event', error: err.message });
    }
});



// 4. Delete an event
app.delete('/api/v3/app/events/:id', async (req, res) => {
    try {
    const { id } = req?.params;

    const result = await db.collection('events').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
    }
});


const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
