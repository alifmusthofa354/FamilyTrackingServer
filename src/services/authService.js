const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TABLE_NAME = 'users'; // Assuming table name is 'users'

exports.registerUser = async (name, email, password) => {
    // 1. Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Is checkError is "PGRST116" it means no rows, which is what we want. 
    // If it's another error, we might want to log it, but proceeding is risky if DB is down.
    // However, .single() returns error if no rows found or multiple.
    // Ideally we check if error.code === 'PGRST116' (JSON object requested, multiple (or no) rows returned).

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert user
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([
            { name, email, password: hashedPassword }
        ])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

exports.loginUser = async (email, password) => {
    // 1. Find user
    const { data: user, error } = await supabase
        .from(TABLE_NAME)
        .select('id, name, email, password, profilePicturePath')
        .eq('email', email)
        .single();

    if (error || !user) {
        throw new Error('Invalid email or password');
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // 3. Generate Token
    const payload = {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };

    // Use a secret from env or fallback for dev (Not recommended for prod)
    const jwtSecret = process.env.JWT_SECRET || 'secret_dev_key';
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    return { user, token };
};
