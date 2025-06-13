const ldap = require('ldapjs');

// LDAP configuration
const LDAP_CONFIG = {
    url: process.env.LDAP_URL || 'ldap://YOUR_AD_SERVER_IP:389', // Replace with your AD server IP
    timeout: 10000, // Increased timeout to 10 seconds
    connectTimeout: 10000,
    reconnect: true,
    tlsOptions: {
        rejectUnauthorized: false // Allow self-signed certificates
    }
};

/**
 * Verify user credentials against LDAP using UPN bind
 * @param {string} email - User's email (username@company.com)
 * @param {string} password - User's password
 * @returns {Promise<boolean>} - Returns true if credentials are valid
 */
const verifyLDAPCredentials = async (email, password) => {
    return new Promise((resolve, reject) => {
        console.log('Attempting LDAP connection to:', LDAP_CONFIG.url);
        
        // Create LDAP client with configuration
        const client = ldap.createClient({
            url: LDAP_CONFIG.url,
            timeout: LDAP_CONFIG.timeout,
            connectTimeout: LDAP_CONFIG.connectTimeout,
            reconnect: LDAP_CONFIG.reconnect,
            tlsOptions: LDAP_CONFIG.tlsOptions
        });

        // Set up error handlers
        client.on('error', (err) => {
            console.error('LDAP client error:', {
                code: err.code,
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            client.unbind();
            reject(new Error(`LDAP connection error: ${err.message}`));
        });

        // Set up connection timeout
        const timeout = setTimeout(() => {
            console.error('LDAP connection timeout');
            client.unbind();
            reject(new Error('LDAP connection timeout'));
        }, LDAP_CONFIG.timeout);

        // Log the bind attempt
        console.log('Attempting LDAP bind with:', email);

        // Attempt to bind with user's credentials
        // Using UPN format: username@company.com
        client.bind(email, password, (err) => {
            clearTimeout(timeout); // Clear the timeout

            if (err) {
                console.error('LDAP bind error details:', {
                    code: err.code,
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
                client.unbind();
                resolve(false);
            } else {
                console.log('LDAP authentication successful for:', email);
                client.unbind();
                resolve(true);
            }
        });
    });
};

module.exports = {
    verifyLDAPCredentials
}; 
