const router = require('express').Router();
const Settings = require('../models/Settings');

router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: true });
    res.json(settings);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
