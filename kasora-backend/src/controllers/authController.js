const db = require('../config/database');
const { createClient } = require('@supabase/supabase-js');
const { body, validationResult } = require('express-validator');
const { errors } = require('../utils/errorFormatter');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const authClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const registerValidations = [
    body('email')
        .isEmail().withMessage('Email must be valid')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain a uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('role')
        .isIn(['supplier', 'buyer']).withMessage('Role must be supplier or buyer'),
    body('business_name')
        .optional()
        .isString()
        .isLength({ max: 100 }).withMessage('Business name too long (max 100 chars)')
        .trim()
];

const loginValidations = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email or username is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

const validate = (req, res, next) => {
    const errorsResult = validationResult(req);
    if (!errorsResult.isEmpty()) {
        return res.status(400).json(errors.validation(errorsResult.array()));
    }
    next();
};

const register = async (req, res) => {
    try {
        const { email, password, role, ...profileData } = req.body;
        
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        
        if (authError) {
            if (authError.message.includes('already been registered') ||
                authError.message.includes('duplicate key') ||
                authError.message.includes('already exists')) {
                return res.status(409).json(errors.conflict('Email already registered'));
            }
            return res.status(400).json(errors.badRequest('Failed to create auth user', authError.message));
        }
        
        const result = await db.query(
            'INSERT INTO users (supabase_uid, email, role) VALUES ($1, $2, $3) RETURNING id, email, role, is_verified',
            [authUser.user.id, email, role]
        );
        
        const user = result.rows[0];
        
        if (role === 'supplier') {
            await db.query(
                'INSERT INTO supplier_profiles (user_id, business_name) VALUES ($1, $2)',
                [user.id, profileData.business_name || 'Untitled Business']
            );
        } else if (role === 'buyer') {
            await db.query(
                'INSERT INTO business_profiles (user_id, business_name) VALUES ($1, $2)',
                [user.id, profileData.business_name || 'Untitled Business']
            );
        }
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                is_verified: user.is_verified 
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') {
            return res.status(409).json(errors.conflict('Email already registered'));
        }
        res.status(500).json(errors.server('Registration failed', error.message));
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error: authError } = await authClient.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !data.user || !data.session) {
            return res.status(401).json(errors.unauthorized('Incorrect email or password'));
        }

        const result = await db.query(
            'SELECT id, email, role, is_verified, verification_status FROM users WHERE supabase_uid = $1',
            [data.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json(errors.notFound('User not found in system'));
        }

        res.json({
            success: true,
            message: 'Login successful',
            token: data.session.access_token,
            session: data.session,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json(errors.server('Login failed', error.message));
    }
};

const getMe = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, role, is_verified, verification_status, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        const user = result.rows[0];
        
        let profile = null;
        if (user.role === 'supplier') {
            const profileResult = await db.query(
                'SELECT * FROM supplier_profiles WHERE user_id = $1',
                [user.id]
            );
            profile = profileResult.rows[0];
        } else if (user.role === 'buyer') {
            const profileResult = await db.query(
                'SELECT * FROM business_profiles WHERE user_id = $1',
                [user.id]
            );
            profile = profileResult.rows[0];
        }
        
        res.json({
            success: true,
            user,
            profile
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json(errors.server('Failed to fetch user'));
    }
};

module.exports = { register, login, getMe, registerValidations, loginValidations, validate };
