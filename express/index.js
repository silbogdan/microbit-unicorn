const app = require('express')();
const path = require('path');
const PORT = 8080;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './microbit_v2.bin'));
});

app.listen(PORT, () => {
    console.log("Listening at port " + PORT);
});