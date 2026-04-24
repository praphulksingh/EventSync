const bcrypt = require('bcryptjs');

const password = '1234567890'; // <--- CHOOSE A STRONG PASSWORD
const saltRounds = 10; // Must match the value in User.js

bcrypt.genSalt(saltRounds, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        console.log(`Original Password: ${password}`);
        console.log(`Hashed Password: ${hash}`);
    });
});