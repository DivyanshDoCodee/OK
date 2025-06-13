const ldap = require('ldapjs');

// LDAP configuration
const LDAP_CONFIG = {
    url: 'ldap://10.0.0.5:389',
    timeout: 5000, // 5 second timeout
    connectTimeout: 5000,
    reconnect: true
};

/**
 * Verify user credentials against LDAP using UPN bind
 * @param {string} email - User's email (username@company.com)
 * @param {string} password - User's password
 * @returns {Promise<boolean>} - Returns true if credentials are valid
 */
const verifyLDAPCredentials = async (email, password) => {
    return new Promise((resolve, reject) => {
        // Create LDAP client with configuration
        const client = ldap.createClient({
            url: LDAP_CONFIG.url,
            timeout: LDAP_CONFIG.timeout,
            connectTimeout: LDAP_CONFIG.connectTimeout,
            reconnect: LDAP_CONFIG.reconnect
        });

        // Set up error handlers
        client.on('error', (err) => {
            console.error('LDAP client error:', err);
            client.unbind();
            reject(new Error('LDAP connection error'));
        });

        // Attempt to bind with user's credentials
        // Using UPN format: username@company.com
        client.bind(email, password, (err) => {
            if (err) {
                console.log('LDAP authentication failed:', err.message);
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
