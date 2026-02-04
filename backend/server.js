const express=require('express');
const authRoutes=require('./Routes/authRoutes');
const studentRoutes=require('./Routes/studentRoutes');
const cors=require('cors');
const app=express();
const dotenv=require('dotenv').config();
const connectDB=require('./config/db');
app.use(express.json()); 

const allowedOrigins = [
  "http://localhost:5173", // local frontend
  "https://quiz-app-gsarc.vercel.app" // deployed frontend
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
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

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
