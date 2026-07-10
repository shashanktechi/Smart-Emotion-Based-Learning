const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const Content = require('./models/Content');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
});
app.use(limiter);

// Health check
app.get('/ping', (req, res) => res.json({ status: 'ok', service: 'node_backend' }));
app.get('/api/ping', (req, res) => res.json({ status: 'ok', service: 'node_backend' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Seed content data
async function seedContent() {
    const count = await Content.count();
    if (count === 0) {
        await Content.bulkCreate([
            // ============================
            // DEFAULT TRACK (Focus / No Trigger)
            // ============================
            { title: 'Introduction to Machine Learning', description: 'Machine Learning is a branch of AI that enables systems to learn and improve from experience without being explicitly programmed. It focuses on the development of algorithms that can access data and use it to learn for themselves.', type: 'video', difficulty: 1, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/ukzFI9rgwfU' },
            { title: 'Python Full Course for Beginners', description: 'Learn Python programming from scratch in this comprehensive tutorial. Python is one of the most popular languages in the world, used in web development, data science, AI, automation, and more. This course covers variables, loops, functions, OOP, and file handling.', type: 'video', difficulty: 1, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/XKHEtdqhLK8' },
            { title: 'Java Programming Full Course', description: 'Complete Java programming tutorial covering fundamentals, OOP concepts, inheritance, polymorphism, exception handling, collections, and multithreading. Java is the backbone of enterprise applications, Android development, and large-scale systems.', type: 'video', difficulty: 2, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/eIrMbAQSU34' },
            { title: 'C Programming Language Tutorial', description: 'Master the C programming language — the foundation of modern computing. Learn pointers, memory management, structures, file I/O, and algorithms. C is essential for systems programming, embedded systems, and understanding how computers work at a low level.', type: 'video', difficulty: 2, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/KJgsSFOSQv0' },
            { title: 'Data Structures & Algorithms Full Course', description: 'Complete DSA course covering arrays, linked lists, stacks, queues, trees, graphs, sorting algorithms, searching algorithms, dynamic programming, and greedy algorithms. Essential for coding interviews and competitive programming.', type: 'video', difficulty: 3, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/8hly31xKli0' },
            { title: 'Web Development Full Course (HTML, CSS, JS)', description: 'Learn modern web development from zero to hero. This course covers HTML5, CSS3, JavaScript ES6+, responsive design, DOM manipulation, APIs, and deploying your first website. The gateway to becoming a full-stack developer.', type: 'video', difficulty: 1, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/nu_pCVPKzTk' },
            { title: 'SQL & Database Management Complete Course', description: 'Master SQL and relational databases. Learn SELECT, JOIN, GROUP BY, subqueries, indexing, normalization, and database design. Databases power every modern application — from social media to banking systems.', type: 'video', difficulty: 2, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/HXV3zeQKqGY' },
            { title: 'Neural Network Fundamentals', description: 'A neural network is a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates. Neural networks adapt and learn from data, making them ideal for pattern recognition.', type: 'video', difficulty: 2, emotion_trigger: null, youtube_url: 'https://www.youtube.com/embed/aircAruvnKk' },

            // ============================
            // CONFUSION → Simplify, break down
            // ============================
            { title: 'Let\'s Simplify This! 🤔', description: 'It seems like this topic might be tricky. Think of Machine Learning like teaching a child — you show them many examples (data), and eventually they learn to recognize patterns on their own. No need to memorize rules; the system discovers them!', type: 'text', difficulty: 1, emotion_trigger: 'confusion' },
            { title: 'Visual Breakdown: ML Made Easy 📊', description: 'Here\'s a simpler way to think about it: Imagine you have a basket of fruits. You teach a computer to tell apples from oranges by showing it hundreds of photos. Over time, it learns the difference — that\'s ML in a nutshell!', type: 'video', difficulty: 1, emotion_trigger: 'confusion', youtube_url: 'https://www.youtube.com/embed/f_uwKZIAeM0' },
            { title: 'Python Basics — Explained Simply 🐍', description: 'Confused by Python syntax? Here\'s the easy version: Variables are just containers with labels. Lists are ordered collections. Functions are reusable blocks of code. If/else is just the computer making decisions. Loops repeat actions. That\'s 80% of Python right there!', type: 'text', difficulty: 1, emotion_trigger: 'confusion' },
            { title: 'DSA Made Easy: What is a Linked List? 🔗', description: 'Think of a linked list like a treasure hunt: each clue (node) tells you where the next clue is. Unlike an array (a row of lockers), you can easily insert clues anywhere in the chain without rearranging everything else!', type: 'text', difficulty: 1, emotion_trigger: 'confusion' },

            // ============================
            // BOREDOM → Challenge & Engage
            // ============================
            { title: 'Challenge Mode! 🚀 Build a Mini Project', description: 'Ready for something more exciting? Try this: Build a simple To-Do app using HTML, CSS, and JavaScript in under 30 minutes. Add features like local storage persistence, dark mode toggle, and swipe-to-delete animations. Show off your skills!', type: 'quiz', difficulty: 3, emotion_trigger: 'boredom' },
            { title: 'Fun Fact: AI in the Wild 🌍', description: 'Did you know? Netflix uses ML to save $1 billion per year by reducing customer churn through personalized recommendations. Spotify\'s Discover Weekly playlist? That\'s ML analyzing 30 billion data points daily. Your phone\'s face unlock? A neural network running in real-time!', type: 'text', difficulty: 2, emotion_trigger: 'boredom' },
            { title: 'Coding Challenge: Reverse a Linked List 🧩', description: 'This is the most asked interview question at Google, Amazon, and Microsoft! Can you reverse a singly linked list in-place using O(1) extra space? Think about using three pointers: prev, current, and next. Try coding it in your language of choice!', type: 'quiz', difficulty: 3, emotion_trigger: 'boredom' },
            { title: 'Speed Coding: FizzBuzz in 5 Languages ⚡', description: 'Think you know programming? Write FizzBuzz in Python, Java, C, JavaScript, AND SQL. Each language has its own twist. Time yourself — can you do all 5 in under 10 minutes? This is a great warm-up for coding interviews!', type: 'quiz', difficulty: 2, emotion_trigger: 'boredom' },

            // ============================
            // HAPPINESS → Advance & Level Up
            // ============================
            { title: 'Great Progress! 🎉 Advanced Concepts', description: 'You\'re doing amazing! Let\'s level up. Convolutional Neural Networks (CNNs) use a mathematical operation called convolution to extract spatial features from images. This is how self-driving cars see, medical AI detects tumors, and your camera groups faces.', type: 'text', difficulty: 3, emotion_trigger: 'happiness' },
            { title: 'Deep Dive: Transformers Architecture 🧠', description: 'Since you\'re in the zone, let\'s explore Transformers — the architecture behind GPT, BERT, and modern AI. Unlike RNNs, Transformers process all positions simultaneously using self-attention mechanisms, enabling unprecedented parallelization and performance.', type: 'video', difficulty: 4, emotion_trigger: 'happiness', youtube_url: 'https://www.youtube.com/embed/kCc8FmEb1nY' },
            { title: 'Advanced Python: Decorators & Generators 🐍✨', description: 'You\'re ready for advanced Python! Decorators are functions that modify other functions — used heavily in Flask/Django. Generators use yield to produce values lazily, saving memory on huge datasets. Master these and you\'ll write truly Pythonic code!', type: 'text', difficulty: 4, emotion_trigger: 'happiness' },
            { title: 'System Design: How Netflix Works 🎬', description: 'Time for architecture! Netflix handles 250 million users with microservices, CDN edge caching, and event-driven processing. Learn about load balancing, database sharding, and how they achieve 99.99% uptime. This is senior engineer territory!', type: 'text', difficulty: 4, emotion_trigger: 'happiness' },

            // ============================
            // FRUSTRATION → Support & Hint
            // ============================
            { title: 'Frustrated? Take a Breath! 🧘', description: 'It\'s completely normal to feel stuck. Deep learning can be tricky! Try breaking the problem down: instead of trying to understand the whole algorithm at once, look at how a single artificial neuron calculates its output: weights times inputs plus bias. You\'ve got this!', type: 'text', difficulty: 1, emotion_trigger: 'frustration' },
            { title: 'Stuck on Code? Common Debugging Tips 💡', description: 'When frustration kicks in, it means your brain is working hard. Try these: 1) Read the error message carefully — it tells you the line number. 2) Add print statements. 3) Check variable types. 4) Google the exact error message. 5) Take a 5-minute walk. 90% of bugs are typos or off-by-one errors!', type: 'text', difficulty: 1, emotion_trigger: 'frustration' },
            { title: 'Step-by-Step: Your First Python Program 🐣', description: 'Let\'s start fresh with the absolute basics. Open any text editor. Type: print("Hello World"). Save it as hello.py. Run it with: python hello.py. Congratulations — you\'re a programmer! Now try: name = input("What is your name? ") and print("Hello", name).', type: 'text', difficulty: 1, emotion_trigger: 'frustration' },

            // ============================
            // SURPRISE → Awe & Expand Horizons
            // ============================
            { title: 'Mind Blown? 🤯 Quantum Computing & AI', description: 'The power of learning! Quantum Machine Learning (QML) merges quantum physics with AI. Using quantum bits (qubits) that can exist in superposition (both 0 and 1 simultaneously), quantum algorithms could theoretically process complex ML computations in seconds that would take classical supercomputers millennia!', type: 'text', difficulty: 4, emotion_trigger: 'surprise' },
            { title: 'Awesome Discovery! 🌟 AI Writing Code', description: 'Modern AI can now write code! GitHub Copilot, powered by OpenAI Codex, was trained on billions of lines of code and can generate entire functions from comments. Google\'s AlphaCode can solve competitive programming problems. We\'re literally teaching machines to be programmers!', type: 'text', difficulty: 3, emotion_trigger: 'surprise' },
            { title: 'The Future: Brain-Computer Interfaces 🧠💻', description: 'Neuralink and similar projects are building direct brain-computer interfaces. Imagine controlling your computer with thoughts, downloading skills like in The Matrix, or restoring vision to the blind. This isn\'t science fiction — early trials are happening NOW!', type: 'text', difficulty: 3, emotion_trigger: 'surprise' }
        ]);
        console.log('✅ Seed content inserted successfully.');
    }
}

// Sync Database
sequelize.sync({ alter: true }).then(async () => {
    console.log('Database synced via Sequelize.');
    await seedContent();
}).catch(err => {
    console.error('Sequelize sync error:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Node backend running on port ${PORT}`);
});
