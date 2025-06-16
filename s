// ... existing code ...

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    try {
        console.log('Login attempt for:', email);

        // Step 1: Try LDAP authentication first
        try {
            console.log('Attempting LDAP authentication');
            const isLDAPAuthenticated = await verifyLDAPCredentials(email, password);
            
            if (isLDAPAuthenticated) {
                console.log('LDAP authentication successful');
                
                // Check if user exists in MongoDB
                let user = await UserModel.findOne({ email: email });
                
                // If user doesn't exist in MongoDB, create one
                if (!user) {
                    console.log('Creating new user in MongoDB for LDAP user');
                    user = new UserModel({
                        email: email,
                        name: email.split('@')[0],
                        password: null, // Don't store any password for LDAP users
                        role: 'user',
                        status: true,
                        authType: 'ldap' // Mark this user as LDAP authenticated
                    });
                    await user.save();
                    console.log('New user created in MongoDB');
                }

                // Generate JWT token
                const token = jwt.sign(
                    { 
                        userId: user._id,
                        email: user.email,
                        role: user.role
                    },
                    config.jwt.secret,
                    { expiresIn: config.jwt.expiresIn }
                );

                // Return success response
                return res.json({
                    success: true,
                    message: "Login successful",
                    token: token,
                    user: {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                });
            }
        } catch (ldapError) {
            console.error('LDAP authentication error:', ldapError);
            
            // Handle specific LDAP errors
            if (ldapError.message.includes('timeout')) {
                return res.status(503).json({
                    success: false,
                    message: "LDAP server is currently unreachable. Please try again later or contact support.",
                    error: "LDAP_CONNECTION_TIMEOUT"
                });
            } else if (ldapError.code === 49) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials",
                    error: "LDAP_INVALID_CREDENTIALS"
                });
            } else {
                return res.status(503).json({
                    success: false,
                    message: "LDAP authentication service is currently unavailable",
                    error: "LDAP_SERVICE_ERROR"
                });
            }
        }

        // If we get here, LDAP authentication failed
        return res.status(401).json({
            success: false,
            message: "Invalid credentials. Please check your email and password.",
            error: "INVALID_CREDENTIALS"
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: "INTERNAL_SERVER_ERROR"
        });
    }
});

// ... rest of the code ...
