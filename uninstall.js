try {
    const getBinary = require('./getBinary');
    if (getBinary != undefined) {
      getBinary.uninstall();
    }
} catch (err) { }