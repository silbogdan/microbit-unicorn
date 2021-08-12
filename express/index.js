const app = require('express')();
const fs = require('fs');
const path = require('path');
const PORT = 8080;

app.get('/', (req, res) => {
    let file = fs.readFileSync('./microbit_v2.bin', 'binary');
    res.status(200).json({file: file});
});

app.listen(PORT, () => {
    console.log("Listening at port " + PORT);
});