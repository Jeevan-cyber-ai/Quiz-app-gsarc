const express=require('express');
const authRoutes=require('./Routes/authRoutes');
const studentRoutes=require('./Routes/studentRoutes');
const cors=require('cors');
const app=express();
const dotenv=require('dotenv').config();
const connectDB=require('./config/db');
app.use(express.json()); 

app.use(cors({
  origin: "*", // or your frontend URL like https://my-quiz-frontend.glitch.me
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.urlencoded({ extended: true }));
connectDB();

app.use("/api/auth", authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', require('./Routes/adminRoutes'));

app.get('/', (req, res) => {
  res.send('Backend is working!');
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
