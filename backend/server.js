require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/products',  require('./routes/products'));
app.use('/api/sales',     require('./routes/sales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/sessions',  require('./routes/sessions'));
app.use('/api/backup',    require('./routes/backup'));

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => { console.error('DB connection failed:', err.message); process.exit(1); });
