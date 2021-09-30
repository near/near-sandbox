const {getBinary} = require('./getBinary');
getBinary().then(bin => bin.download());
